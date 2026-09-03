import fs from "fs";
import path from "path";
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

async function main() {
  const file = path.join(__dirname, "real-data.json");
  if (!fs.existsSync(file)) {
    throw new Error("prisma/real-data.json is an external rights-gated dataset. Import the official source locally before seeding, or use DATA_SOURCE=mock.");
  }
  const data = JSON.parse(fs.readFileSync(file, "utf8")) as {
    persons: {
      id: string;
      name: string;
      surname: string;
      bonGwan: string;
      clanId: string;
      residence: string;
      birthYear?: number | null;
      deathYear?: number | null;
    }[];
    exams: {
      id: string;
      personId: string;
      type: "mun" | "mu" | "saengwon" | "jinsa";
      year: number;
      kingId: string;
      grade: string;
    }[];
    relations: {
      personId: string;
      relatedPersonId: string;
      type: string;
    }[];
  };
  const locations = JSON.parse(
    fs.readFileSync(path.join(__dirname, "clan-research.json"), "utf8"),
  ) as {
    records: Array<{
      clanId: string; bonGwan: string; surname: string; status: string; note?: string;
      locations: Array<{
        id: string; kind: string; name: string; modernArea: string;
        latitude: number; longitude: number; status: string; note?: string;
        evidence: Array<{
          id: string; provider: string; title: string; url: string; licenseCode: string;
          licenseUrl: string; retrievedAt: string; evidenceSummary: string; contentHash: string;
        }>;
      }>;
    }>;
  };

  await prisma.exam.deleteMany();
  await prisma.personRelation.deleteMany();
  await prisma.person.deleteMany();
  await prisma.clanLocationEvidence.deleteMany();
  await prisma.clanLocation.deleteMany();
  await prisma.clanResearch.deleteMany();

  const persons = await createManyChunked(
    prisma.person,
    data.persons.map((p) => ({
      id: p.id,
      name: p.name,
      surname: p.surname,
      bonGwan: p.bonGwan,
      clanId: p.clanId,
      residence: p.residence,
      birthYear: p.birthYear ?? null,
      deathYear: p.deathYear ?? null,
    })),
  );
  const exams = await createManyChunked(prisma.exam, data.exams);
  const relations = await createManyChunked(prisma.personRelation, data.relations);
  const researches = await createManyChunked(
    prisma.clanResearch,
    locations.records.map((record) => ({
      clanId: record.clanId,
      bonGwan: record.bonGwan,
      surname: record.surname,
      status: record.status,
      note: record.note ?? null,
      reviewedAt: null,
    })),
  );
  const clanLocations = await createManyChunked(
    prisma.clanLocation,
    locations.records.flatMap((record) => record.locations.map((location) => ({
      id: location.id,
      clanId: record.clanId,
      bonGwan: record.bonGwan,
      surname: record.surname,
      kind: location.kind,
      name: location.name,
      modernArea: location.modernArea,
      latitude: location.latitude,
      longitude: location.longitude,
      status: location.status,
      confidence: location.status === "verified" ? "verified" : "reported",
      sourceTitle: location.evidence[0]?.title ?? "공식 출처 검증 대기",
      sourceUrl: location.evidence[0]?.url ?? null,
      note: location.note ?? null,
    }))),
  );
  const evidence = await createManyChunked(
    prisma.clanLocationEvidence,
    locations.records.flatMap((record) => record.locations.flatMap((location) => location.evidence.map((item) => ({
      id: item.id,
      clanId: record.clanId,
      locationId: location.id,
      provider: item.provider,
      title: item.title,
      url: item.url,
      licenseCode: item.licenseCode,
      licenseUrl: item.licenseUrl,
      retrievedAt: new Date(item.retrievedAt),
      evidenceSummary: item.evidenceSummary,
      contentHash: item.contentHash,
    })))),
  );

  console.log(`seeded ${persons} persons, ${exams} exams, ${relations} relations, ${researches} research records, ${clanLocations} clan locations, ${evidence} evidence records`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
