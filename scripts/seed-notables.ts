import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: "file:./prisma/dev.db" }),
});

const CHUNK = 5000;

type CreateManyDelegate<T> = {
  createMany: (args: { data: T[] }) => Promise<{ count: number }>;
};

async function createManyChunked<T>(
  delegate: CreateManyDelegate<T>,
  rows: T[],
): Promise<number> {
  let count = 0;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    const res = await delegate.createMany({ data: chunk });
    count += res.count;
  }
  return count;
}

/** "경주 김씨" -> "경주-김" (우리 clanId 형식) */
function toClanId(clanLabel: string): string | null {
  let s = clanLabel.trim();
  if (s.endsWith("씨")) s = s.slice(0, -1);
  const idx = s.lastIndexOf(" ");
  if (idx === -1) return null;
  return `${s.slice(0, idx)}-${s.slice(idx + 1)}`;
}

function parseYear(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const m = value.match(/^(-?\d{1,4})/);
  if (!m) return null;
  const y = parseInt(m[1], 10);
  return Number.isFinite(y) ? y : null;
}

async function main() {
  const existing = new Set(
    (
      await prisma.person.findMany({
        select: { clanId: true },
        distinct: ["clanId"],
      })
    ).map((r) => r.clanId),
  );

  const query = `
SELECT ?person ?personLabel ?clanLabel ?desc ?birth ?death (GROUP_CONCAT(DISTINCT ?occLabel; SEPARATOR=", ") AS ?occs) WHERE {
  ?person wdt:P31 wd:Q5 ;
          wdt:P53 ?clan .
  ?clan wdt:P31/wdt:P279* wd:Q846706 .
  OPTIONAL { ?person schema:description ?desc . FILTER(LANG(?desc) = "ko") }
  OPTIONAL { ?person wdt:P569 ?birth. }
  OPTIONAL { ?person wdt:P570 ?death. }
  OPTIONAL { ?person wdt:P106 ?occ . }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "ko". }
}
GROUP BY ?person ?personLabel ?clanLabel ?desc ?birth ?death
LIMIT 10000`;

  const url =
    "https://query.wikidata.org/sparql?query=" +
    encodeURIComponent(query) +
    "&format=json";

  let res: Response | null = null;
  let lastErr = "";
  for (let attempt = 0; attempt < 3; attempt++) {
    res = await fetch(url, {
      headers: {
        "User-Agent": "SisyphusBot/1.0 (contact: user@example.com)",
        Accept: "application/sparql-results+json",
      },
    });
    if (res.ok) break;
    lastErr = `HTTP ${res.status}`;
    console.warn(`Wikidata attempt ${attempt + 1} failed: ${lastErr}, retrying...`);
    await new Promise((r) => setTimeout(r, 2000));
  }
  if (!res || !res.ok) {
    throw new Error(`Wikidata SPARQL failed after retries: ${lastErr}`);
  }
  const json = (await res.json()) as {
    results: { bindings: Record<string, { value: string }>[] };
  };
  const bindings = json.results.bindings;

  const qid = (uri: string) => uri.split("/").pop() ?? uri;

  const rows = bindings
    .map((b) => {
      const clanId = toClanId(b.clanLabel?.value ?? "");
      if (!clanId || !existing.has(clanId)) return null;
      return {
        id: `${qid(b.person.value)}::${clanId}`,
        wikidataId: qid(b.person.value),
        name: b.personLabel?.value ?? "",
        clanId,
        description: b.desc?.value ?? null,
        occupation: b.occs?.value ?? null,
        birthYear: parseYear(b.birth?.value),
        deathYear: parseYear(b.death?.value),
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  const dedup = new Map<string, (typeof rows)[number]>();
  for (const r of rows) if (!dedup.has(r.id)) dedup.set(r.id, r);
  const deduped = [...dedup.values()];

  await prisma.clanNotable.deleteMany();
  const count = await createManyChunked(prisma.clanNotable, deduped);
  console.log(`dedup: ${rows.length} -> ${deduped.length}`);
  console.log(
    `seeded ${count} notables (from ${bindings.length} wikidata results, ${existing.size} clans)`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
