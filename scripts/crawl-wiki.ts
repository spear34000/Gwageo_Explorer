import fs from 'fs';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
const DELAY = 350;

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
      if(attempt===2) throw e;
      await sleep(1000);
    }
  }
  return null;
}

async function main(){
  const j = JSON.parse(fs.readFileSync('prisma/real-data.json','utf8')) as { clans: { id:string, name:string }[] };
  console.log(`total clans: ${j.clans.length}`);
  const results: { clanId:string, name:string, url:string, hasInfobox:boolean, famousCount:number, famous: {name:string, url:string}[] }[] = [];
  try {
    const prev = JSON.parse(fs.readFileSync('wiki_links.json','utf8')) as typeof results;
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
    // 위키백과 URL은 공백을 _ 로 (예: 풍천_임씨)
    const title = clan.name.replace(/ /g, '_');
    const url = `https://ko.wikipedia.org/wiki/${encodeURIComponent(title).replace(/%20/g,'_')}`;
    // actually encode then keep _ - encodeURIComponent encodes _ ? No, _ is unreserved, stays _. But spaces were replaced with _. So use encodeURI for Korean
    const url2 = `https://ko.wikipedia.org/wiki/${encodeURI(title)}`;
    let html: string | null = null;
    try { html = await fetchText(url2); } catch(e:any){ console.warn(`fail ${clan.name}: ${e.message}`); }
    checked++;
    if(html===null){
      if(checked % 100===0) console.log(`checked ${checked} -> pages ${results.length}`);
      await sleep(DELAY);
      continue;
    }
    const hasInfobox = /class="infobox"/i.test(html);
    const famous: {name:string, url:string}[] = [];
    // 1) data-mw JSON in transclusion span: "주요 인물" param or 인물 links
    // the raw wikitext is embedded in data-mw='{"parts":[{"template":...,"주요 인물":{"wt":"[[...]], [[...]]"}}]}'
    const dataMwMatches = [...html.matchAll(/data-mw='(\{.*?\})'/g)];
    for(const dm of dataMwMatches){
      try{
        const raw = dm[1].replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&').replace(/&quot;/g,'"');
        const parsed = JSON.parse(raw);
        const parts = parsed.parts || [];
        for(const part of parts){
          const params = part.template?.params || {};
          for(const key of Object.keys(params)){
            if(/인물/.test(key)){
              const wt = params[key]?.wt || '';
              const links = [...wt.matchAll(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g)];
              for(const lm of links){
                const nm = (lm[2] || lm[1]).trim();
                if(nm && nm.length>=2) famous.push({ name: nm, url: `https://ko.wikipedia.org/wiki/${encodeURI(lm[1].trim().replace(/ /g,'_'))}` });
              }
            }
          }
        }
      }catch{}
    }
    // 2) rendered infobox 주요 인물 row (utf8)
    if(famous.length===0){
      const buf = Buffer.from(html, 'binary');
      const text = buf.toString('utf8');
      const infoMatch = text.match(/주요\s*인물[\s\S]{0,3000}?<\/td>/);
      if(infoMatch){
        const links = [...infoMatch[0].matchAll(/<a[^>]*href="(\/wiki\/[^"]+)"[^>]*title="([^"]+)"[^>]*>([^<]+)<\/a>/g)];
        for(const lm of links){
          famous.push({ name: lm[3].trim(), url: `https://ko.wikipedia.org${lm[1]}` });
        }
      }
    }
    // dedup
    const seen = new Set<string>();
    const deduped = famous.filter(f=> { if(seen.has(f.name)) return false; seen.add(f.name); return f.name.length>=2 && !f.name.includes('편집'); });
    if(hasInfobox || deduped.length>0){
      results.push({ clanId: clan.id, name: clan.name, url: url2, hasInfobox, famousCount: deduped.length, famous: deduped.slice(0,30) });
      if(deduped.length>0) console.log(`FOUND ${clan.name} (${deduped.length}명) -> ${url2}`);
    }
    if(checked % 100===0) {
      console.log(`checked ${checked} -> pages ${results.length}, famous total ${results.reduce((a,r)=>a+r.famousCount,0)}`);
      fs.writeFileSync('wiki_links.json', JSON.stringify(results));
    }
    await sleep(DELAY);
  }
  console.log(`done: checked ${checked}, pages ${results.length}`);
  fs.writeFileSync('wiki_links.json', JSON.stringify(results, null, 2));
  const totalFamous = results.reduce((a,r)=>a+r.famousCount,0);
  console.log(`total famous: ${totalFamous}`);
  // csv summary
  const csv = ['clanId,name,url,hasInfobox,famousCount', ...results.map(r=> `${r.clanId},"${r.name}",${r.url},${r.hasInfobox},${r.famousCount}`)].join('\n');
  fs.writeFileSync('wiki_links.csv', csv);
  console.log('saved wiki_links.json/csv');
}

main().catch(e=>{ console.error(e); process.exit(1); });
