import fs from 'fs';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
const DELAY = 200;
function sleep(ms: number){ return new Promise(r=>setTimeout(r, ms)); }

async function fetchText(url: string): Promise<string | null> {
  for(let attempt=0; attempt<3; attempt++){
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 15000);
    try{
      const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept': 'text/html' }, signal: ctrl.signal });
      clearTimeout(timer);
      if(res.status===404) return null;
      if(!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    }catch(e){
      clearTimeout(timer);
      if(attempt===2) throw e;
      await sleep(1200);
    }
  }
  return null;
}

function extractNames(html: string): {name:string, url:string}[] {
  const out: {name:string, url:string}[] = [];
  const seen = new Set<string>();
  const heads: number[] = [];
  const re = /<h[2-5][^>]*>[\s\S]{0,300}?출신 인물[\s\S]{0,300}?<\/h[2-5]>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) heads.push(m.index);
  const re2 = /<h[2-5][^>]*>[\s\S]{0,300}?(인물 목록|유명인|유명 인물)[\s\S]{0,300}?<\/h[2-5]>/g;
  while ((m = re2.exec(html)) !== null) heads.push(m.index);
  if (heads.length === 0) {
    const keys = ['출신 인물', '인물 목록', '유명인', '유명 인물'];
    for (const k of keys) {
      let i = html.indexOf(k);
      while (i !== -1) { heads.push(i); i = html.indexOf(k, i + 1); if (heads.length > 12) break; }
      if (heads.length > 0) break;
    }
  }
  for (const idx of heads) {
    const seg = html.slice(idx, idx + 15000);
    const links = seg.matchAll(/<a[^>]*class='S5ro1EF0'[^>]*href='\/w\/([^']+)'[^>]*>([^<]{1,30})<\/a>/g);
    for (const lm of links) {
      let raw: string;
      try { raw = decodeURIComponent(lm[1]); } catch { raw = lm[1]; }
      const label = lm[2].trim();
      // skip era/category links (신라, 고려, 조선, 대한민국, 일제강점기 etc.)
      if (/^(신라|고려|조선|대한민국|일제강점기|한국|북한|중국|일본|베트남)$/.test(label)) continue;
      const name = label.split('(')[0].trim();
      if (name.length < 2 || name.length > 12) continue;
      if (seen.has(name)) continue;
      seen.add(name);
      out.push({ name, url: 'https://namu.wiki/w/' + lm[1] });
      if (out.length >= 60) break;
    }
    if (out.length >= 60) break;
  }
  return out;
}

async function main(){
  const j = JSON.parse(fs.readFileSync('prisma/real-data.json','utf8')) as { clans: { id:string, name:string }[] };
  console.log(`total clans: ${j.clans.length}`);
  const results: { clanId:string, name:string, url:string, famous: {name:string, url:string}[] }[] = [];
  try {
    const prev = JSON.parse(fs.readFileSync('namu_famous_names.json','utf8')) as typeof results;
    for (const r of prev) results.push(r);
    console.log(`resumed with ${results.length} existing pages`);
  } catch {}
  const doneIds = new Set(results.map(r => r.clanId));
  const FROM = parseInt(process.env.FROM ?? '0', 10);
  const TO = parseInt(process.env.TO ?? String(j.clans.length), 10);
  console.log(`range ${FROM}..${TO}`);
  let checked = 0;
  const slice = j.clans.slice(FROM, TO);
  for(const clan of slice){
    if (doneIds.has(clan.id)) continue;
    const url = 'https://namu.wiki/w/' + encodeURIComponent(clan.name);
    let html: string | null = null;
    try { html = await fetchText(url); } catch(e:any){ console.warn(`fail ${clan.name}: ${e.message}`); }
    checked++;
    if(html===null){ await sleep(DELAY); continue; }
    const famous = extractNames(html);
    if(famous.length>0){
      results.push({ clanId: clan.id, name: clan.name, url, famous });
      console.log(`FOUND ${clan.name} (${famous.length}명)`);
    }
    if(checked % 100===0) {
      console.log(`checked ${checked}/${j.clans.length} -> pages ${results.length}, famous ${results.reduce((a,r)=>a+r.famous.length,0)}`);
      fs.writeFileSync('namu_famous_names.json', JSON.stringify(results));
    }
    await sleep(DELAY);
  }
  fs.writeFileSync('namu_famous_names.json', JSON.stringify(results, null, 2));
  console.log(`done: checked ${checked}, pages ${results.length}, famous ${results.reduce((a,r)=>a+r.famous.length,0)}`);
}

main().catch(e=>{ console.error(e); process.exit(1); });
