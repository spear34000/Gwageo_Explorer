import fs from 'fs';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
const WORKERS = 5;
const SAVE_EVERY = 500;
const OUT = 'ency_persons.json';

function sleep(ms: number){ return new Promise(r=>setTimeout(r, ms)); }

function decodeEntities(s: string): string {
  return s.replace(/&#x([0-9A-Fa-f]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#([0-9]+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
}

async function fetchText(url: string): Promise<string | null> {
  for(let attempt=0; attempt<2; attempt++){
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 20000);
    try{
      const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept': 'text/html' }, signal: ctrl.signal });
      clearTimeout(timer);
      if(res.status===404) return null;
      if(!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = await res.arrayBuffer();
      return new TextDecoder('utf-8').decode(buf);
    }catch(e){
      clearTimeout(timer);
      if(attempt===1) return null;
      await sleep(1500);
    }
  }
  return null;
}

function parsePerson(eid: string, html: string): { eid: string; name: string; bongwan: string } | null {
  const tm = html.match(/<title>([^<]+)<\/title>/) || html.match(/<meta property="og:title" content="([^"]+)"\s*\/?>/);
  if(!tm) return null;
  const title = decodeEntities(tm[1]).trim();
  const name = title.split(' - ')[0].trim();
  if(!name || name.length < 2 || name.length > 12) return null;
  if(!/^[가-힣]+$/.test(name.replace(/[·・\s]/g, ''))) return null;
  const bm = html.match(/본관은?\s*([가-힣]{1,5})\s*\(/);
  if(!bm) return null;
  return { eid, name, bongwan: bm[1] };
}

async function main(){
  const urls: string[] = JSON.parse(fs.readFileSync('ency_urls.json','utf8'));
  console.log(`total urls: ${urls.length}`);
  let results: { eid: string; name: string; bongwan: string }[] = [];
  try {
    const prev = JSON.parse(fs.readFileSync(OUT,'utf8')) as typeof results;
    results = prev;
    console.log(`resumed with ${results.length} persons`);
  } catch {}
  const done = new Set(results.map(r => r.eid));
  let fetchedEids: string[] = [];
  try { fetchedEids = JSON.parse(fs.readFileSync('ency_done.json','utf8')); } catch {}
  const fetchedSet = new Set([...done, ...fetchedEids]);
  const queue = urls.filter(u => !fetchedSet.has(u.split('/').pop()!));
  console.log(`queue: ${queue.length} (skip ${urls.length - queue.length})`);
  let fetched = 0;
  let found = results.length;

  function saveAll(){
    fs.writeFileSync(OUT, JSON.stringify(results));
    fs.writeFileSync('ency_done.json', JSON.stringify([...fetchedSet]));
  }

  async function worker(id: number){
    while(queue.length > 0){
      const url = queue.shift()!;
      const eid = url.split('/').pop()!;
      try{
        const html = await fetchText(url);
        fetched++;
        fetchedSet.add(eid);
        if(html){
          const p = parsePerson(eid, html);
          if(p){ results.push(p); found++; }
        }
      }catch(e:any){
        fetchedSet.add(eid);
      }
      if(fetched % SAVE_EVERY === 0){
        saveAll();
        console.log(`fetched ${fetched}, found ${found}`);
      }
    }
  }

  const workers = Array.from({length: WORKERS}, (_, i) => worker(i));
  await Promise.all(workers);
  fs.writeFileSync(OUT, JSON.stringify(results, null, 2));
  fs.writeFileSync('ency_done.json', JSON.stringify([...fetchedSet]));
  console.log(`done: fetched ${fetched}, found ${found}`);
}

main().catch(e=>{ console.error(e); process.exit(1); });
