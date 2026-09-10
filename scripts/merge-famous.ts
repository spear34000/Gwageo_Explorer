import fs from 'fs';

type RawEntry = { clanId: string; name: string; url: string; famous: { name: string; url: string }[] };
type Merged = {
  clanId: string; clanName: string; bonGwan: string; surname: string;
  personName: string; sources: string[]; urls: string[];
};

function normName(s: string): string {
  return s.split('(')[0].split('[')[0].replace(/\s+/g, '').trim();
}

async function main(){
  const wiki: RawEntry[] = JSON.parse(fs.readFileSync('wiki_links.json','utf8'));
  let namu: RawEntry[] = [];
  try { namu = JSON.parse(fs.readFileSync('namu_famous_names.json','utf8')); } catch { console.log('no namu file, wiki only'); }
  const clans: { id:string; bonGwan:string; surname:string; name:string }[] =
    (JSON.parse(fs.readFileSync('prisma/real-data.json','utf8')) as any).clans;
  const clanMap = new Map(clans.map(c => [c.id, c]));

  const seen = new Set<string>();
  const merged: Merged[] = [];
  const wikiOnly: Merged[] = [];

  function push(e: RawEntry, source: string, target: Merged[], seenSet: Set<string>) {
    const clan = clanMap.get(e.clanId);
    if (!clan) return;
    for (const f of e.famous) {
      const personName = normName(f.name);
      if (personName.length < 2 || personName.length > 12) continue;
      const key = `${e.clanId}|${personName}`;
      if (seenSet.has(key)) {
        const ex = target.find(t => t.clanId === e.clanId && t.personName === personName);
        if (ex && !ex.sources.includes(source)) { ex.sources.push(source); ex.urls.push(f.url); }
        continue;
      }
      seenSet.add(key);
      target.push({
        clanId: e.clanId, clanName: clan.name, bonGwan: clan.bonGwan, surname: clan.surname,
        personName, sources: [source], urls: [f.url],
      });
    }
  }

  for (const e of wiki) push(e, 'wiki', wikiOnly, new Set());
  // rebuild with shared seen for full merge
  const fullSeen = new Set<string>();
  const full: Merged[] = [];
  for (const e of wiki) push(e, 'wiki', full, fullSeen);
  for (const e of namu) push(e, 'namu', full, fullSeen);

  fs.writeFileSync('prisma/famous-data.json', JSON.stringify({
    meta: {
      source: 'ko.wikipedia.org 본관 문서 infobox 주요 인물 (CC BY-SA 4.0, 출처 표기)',
      generatedAt: new Date().toISOString(),
      count: wikiOnly.length,
    },
    items: wikiOnly,
  }, null, 2));

  fs.writeFileSync('famous-db.json', JSON.stringify({
    meta: {
      source: 'wikipedia(CC BY-SA) + namu.wiki(CC BY-NC-SA, 비상업·로컬 전용)',
      generatedAt: new Date().toISOString(),
      count: full.length,
      note: 'namu-derived entries are NC-licensed: DO NOT push to public MIT repo',
    },
    items: full,
  }, null, 2));

  const csv = ['clanId,clanName,bonGwan,surname,personName,sources', ...full.map(r => `${r.clanId},"${r.clanName}",${r.bonGwan},${r.surname},${r.personName},${r.sources.join('+')}`)].join('\n');
  fs.writeFileSync('famous-db.csv', csv);

  const byClan = new Map<string, number>();
  for (const r of full) byClan.set(r.clanId, (byClan.get(r.clanId) ?? 0) + 1);
  const top = [...byClan.entries()].sort((a,b) => b[1]-a[1]).slice(0,15);
  console.log(`wiki pages: ${wiki.length}, namu pages: ${namu.length}`);
  console.log(`wikiOnly items: ${wikiOnly.length}, full merged: ${full.length}, clans covered: ${byClan.size}`);
  console.log('top clans:', top.map(([c,n]) => `${c} ${n}`).join(', '));
}

main().catch(e=>{ console.error(e); process.exit(1); });
