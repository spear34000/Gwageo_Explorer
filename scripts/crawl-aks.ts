import fs from 'fs';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '../generated/prisma/client';

const prisma = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: 'file:./prisma/dev.db' }) });

const SURNAMES = ['김','이','박','최','정','조','윤','장','임','한','오','서','신','권','황','안','송','전','홍','류','고','문','양','손','배','백','허','남','심','노','하','곽','성','차','주','우','구','민','유','진','지','엄','채','원','천','방','공','강','현','변','염','여','추','도','소','석','선','설','마','길','연','위','표','명','기','반','왕','금','옥','육','인','맹','제','모','탁','국','어','은','편','용'];
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
const DELAY_MS = 350;

function sleep(ms: number){ return new Promise(r=>setTimeout(r, ms)); }

function toClanId(bonGwan: string, surname: string){
  let b = bonGwan.split('(')[0].trim();
  if(!b || b==='미상') return null;
  return `${b}-${surname}`;
}

async function fetchText(url: string){
  for(let attempt=0; attempt<3; attempt++){
    try{
      const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept': 'text/html' } });
      if(!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = await res.arrayBuffer();
      const text = new TextDecoder('utf-8').decode(buf);
      return text;
    }catch(e){
      if(attempt===2) throw e;
      await sleep(1000);
    }
  }
  throw new Error('fetch failed');
}

async function fetchPost(url: string, body: string){
  for(let attempt=0; attempt<3; attempt++){
    try{
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'User-Agent': UA, 'Accept': 'text/html', 'Content-Type': 'application/x-www-form-urlencoded' },
        body
      });
      if(!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = await res.arrayBuffer();
      const text = new TextDecoder('utf-8').decode(buf);
      return text;
    }catch(e){
      if(attempt===2) throw e;
      await sleep(1000);
    }
  }
  throw new Error('fetchPost failed');
}

async function collectPplIds(): Promise<string[]>{
  const ids = new Set<string>();
  for(const surname of SURNAMES.slice(0,30)){
    console.log(`search surname: ${surname}`);
    let totalPage = 1;
    let first = true;
    for(let page=1; page<=totalPage; page++){
      const body = new URLSearchParams({
        kristalCategory: '1',
        kristalSearchType: '1',
        kristalSearchWord: surname,
        kristalSearchArea: 'P',
        isEQ: 'false',
        kristalCurPage: String(page),
        isNew: 'true'
      }).toString();
      const html = await fetchPost('http://people.aks.ac.kr/front/search/totalSearch.aks', body);
      if(first){
        const m = html.match(/var totalPage = (\d+);/);
        if(m) totalPage = parseInt(m[1],10);
        console.log(`  totalPage for ${surname}: ${totalPage}`);
        first = false;
        if(totalPage===0) break;
      }
      const matches = [...html.matchAll(/pplView\.aks\?pplId=([^&"']+)/g)];
      if(matches.length===0){
        console.log(`  ${surname} page ${page} -> 0 ids, stop`);
        break;
      }
      const before = ids.size;
      for(const mm of matches) ids.add(mm[1]);
      const added = ids.size - before;
      console.log(`  ${surname} page ${page}/${totalPage} -> ${matches.length} raw ids, +${added} new (unique ${ids.size})`);
      await sleep(DELAY_MS);
      if(ids.size > 4000) break;
      if(page >= 5 && surname !== '김' && surname !== '이' && surname !== '박') {
        // for pilot, limit pages per surname to 5 for non-top surnames to save time
        if(page >= 5) break;
      }
    }
    await sleep(DELAY_MS);
    if(ids.size > 4000) break;
  }
  console.log(`collected ${ids.size} pplIds`);
  return [...ids];
}

async function fetchBonGwanAndName(pplId: string): Promise<{bonGwan: string | null, name: string | null}>{
  const url = `http://people.aks.ac.kr/front/dirSer/ppl/pplView.aks?pplId=${pplId}`;
  const html = await fetchText(url);
  let bonGwan: string | null = null;
  let name: string | null = null;
  let m = html.match(/본관<\/span><\/td>\s*<td[^>]*>\s*<span[^>]*class="place"[^>]*>([^<]+)</);
  if(m) bonGwan = m[1].split('(')[0].trim();
  else {
    const pm = html.match(/<span class="place">([^<]+)<\/span>/);
    if(pm) bonGwan = pm[1].split('(')[0].trim();
  }
  let nm = html.match(/<h5[^>]*>[\s\S]*?<a[^>]*>([^<\(]+)\(/);
  if(nm) name = nm[1].trim();
  else {
    const t = html.match(/<title[^>]*>([^<]+) -/);
    if(t) name = t[1].trim().split(' ')[0];
  }
  return { bonGwan, name };
}

async function main(){
  const pplIds = await collectPplIds();
  const samplePath = 'pplIds.json';
  fs.writeFileSync(samplePath, JSON.stringify(pplIds.slice(0,2000), null, 2));
  console.log(`saved ${Math.min(pplIds.length,2000)} sample ids to ${samplePath}`);

  const existingClans = new Set((await prisma.person.findMany({ select:{ clanId:true }, distinct:['clanId'] })).map(r=>r.clanId));
  console.log(`existing clans: ${existingClans.size}`);

  let inserted = 0;
  let skipped = 0;
  const batch: any[] = [];
  const limit = Math.min(pplIds.length, 1500);
  for(let i=0; i<limit; i++){
    const pplId = pplIds[i];
    try{
      const { bonGwan, name } = await fetchBonGwanAndName(pplId);
      if(!bonGwan || !name) { skipped++; continue; }
      const surname = name.charAt(0);
      if(!surname) { skipped++; continue; }
      const clanId = toClanId(bonGwan, surname);
      if(!clanId || !existingClans.has(clanId)) { skipped++; continue; }
      batch.push({
        id: `${pplId}::${clanId}`,
        wikidataId: pplId,
        name,
        clanId,
        description: 'AKS 역대인물',
        occupation: null,
        birthYear: null,
        deathYear: null,
      });
      if(batch.length >= 400){
        await prisma.clanNotable.createMany({ data: batch });
        inserted += batch.length;
        console.log(`inserted ${inserted} / ${i+1} pplIds (skipped ${skipped})`);
        batch.length = 0;
      }
    }catch(e:any){
      console.warn(`fail ${pplId}: ${e.message}`);
    }
    await sleep(DELAY_MS);
    if(i % 100 === 0) console.log(`progress ${i}/${limit}`);
  }
  if(batch.length){
    await prisma.clanNotable.createMany({ data: batch });
    inserted += batch.length;
  }
  console.log(`done: inserted ${inserted}, skipped ${skipped}, total pplIds ${pplIds.length}`);
  await prisma.$disconnect();
}

main().catch(e=>{ console.error(e); process.exit(1); });
