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

  await prisma.exam.deleteMany();
  await prisma.personRelation.deleteMany();
  await prisma.person.deleteMany();

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

  console.log(`seeded ${persons} persons, ${exams} exams, ${relations} relations`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());