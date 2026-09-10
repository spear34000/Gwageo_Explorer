import fs from 'fs';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
const DELAY = 250;
const OUT = 'wiki_sections.json';

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
      const buf = await res.arrayBuffer();
      return new TextDecoder('utf-8').decode(buf);
    }catch(e){
      clearTimeout(timer);
      if(attempt===2) return null;
      await sleep(1000);
    }
  }
  return null;
}

const SKIP = /^(신라|고려|조선|대한민국|한국|북한|중국|일본|서울|한성|개성|평양|경주|전주|서o울|.*시대|.*왕조|.*전쟁|.*운동|.*사건|.*당|.*파|.*군|.*현|.*도|.*시|.*구|.*읍|.*면|.*리|.*년|.*월|.*일)$/;
const ERA = /(신라|고려|조선|대한민국|일제|삼국|통일|왕조|시대|전쟁|사변|운동|사건|조약|조약|헌법|공화국|제국|왕국|도호부|목사|판서|대감|영의정|좌의정|우의정)/;

function extractSections(html: string): {name:string, url:string}[] {
  const out: {name:string, url:string}[] = [];
  const seen = new Set<string>();
  const text = html;
  const re = /<h2[^>]*>[\s\S]{0,200}?((역대|대표|주요|유명|출신|현대|역사)(적|적인)?\s*(인물|인사)|인물\s*목록|유명\s*인)[\s\S]{0,200}?<\/h2>/g;
  let m: RegExpExecArray | null;
  const segs: string[] = [];
  while ((m = re.exec(text)) !== null) {
    const start = m.index + m[0].length;
    const rest = text.slice(start, start + 25000);
    const endIdx = rest.search(/<h2[^>]*>/);
    segs.push(endIdx > 0 ? rest.slice(0, endIdx) : rest);
  }
  const NS = /^(분류|파일|틀|위키백과|도움말|미디어위키|특수|포털|초안|모듈|Category|File|Template):/;
  for (const body of segs) {
    const links = body.matchAll(/<a[^>]*href="(?:https:\/\/ko\.wikipedia\.org)?(\/wiki\/[^"#?]+)"[^>]*title="([^"]+)"[^>]*>([^<]{1,20})<\/a>/g);
    for (const lm of links) {
      const label = lm[3].trim();
      const title = lm[2].trim();
      if (NS.test(title) || NS.test(label)) continue;
      if (label.length < 2 || label.length > 5) continue;
      if (!/^[가-힣]+$/.test(label)) continue;
      if (SKIP.test(label) || ERA.test(title)) continue;
      if (/년|월|일|시|군|현|도$/.test(label) && label.length > 3) continue;
      if (seen.has(label)) continue;
      seen.add(label);
      out.push({ name: label, url: `https://ko.wikipedia.org${lm[1]}` });
      if (out.length >= 80) break;
    }
    if (out.length >= 80) break;
  }
  return out;
}

async function main(){
  const links: { clanId:string; name:string; url:string }[] = JSON.parse(fs.readFileSync('wiki_links.json','utf8'));
  console.log(`total pages: ${links.length}`);
  let results: { clanId:string; name:string; url:string; famous: {name:string, url:string}[] }[] = [];
  try {
    const prev = JSON.parse(fs.readFileSync(OUT,'utf8')) as typeof results;
    results = prev;
    console.log(`resumed with ${results.length} pages`);
  } catch {}
  const doneIds = new Set(results.map(r => r.clanId));
  let checked = 0;
  for(const page of links){
    if (doneIds.has(page.clanId)) continue;
    const html = await fetchText(page.url);
    checked++;
    if(html){
      const famous = extractSections(html);
      if(famous.length>0){
        results.push({ clanId: page.clanId, name: page.name, url: page.url, famous });
        console.log(`FOUND ${page.name} (${famous.length}명)`);
      }
    }
    if(checked % 100===0){
      console.log(`checked ${checked} -> pages ${results.length}`);
      fs.writeFileSync(OUT, JSON.stringify(results));
    }
    await sleep(DELAY);
  }
  fs.writeFileSync(OUT, JSON.stringify(results, null, 2));
  console.log(`done: checked ${checked}, pages ${results.length}, famous ${results.reduce((a,r)=>a+r.famous.length,0)}`);
}

main().catch(e=>{ console.error(e); process.exit(1); });
