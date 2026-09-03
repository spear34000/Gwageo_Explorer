import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../generated/prisma/client";
import fs from "node:fs";
import path from "node:path";

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: "file:./prisma/dev.db" }),
});

async function main() {
  const generated = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), "prisma", "clan-research.json"), "utf8"),
  ) as { records: Array<unknown> };
  const expectedLocationCount = generated.records.reduce<number>((total, record) => {
    const item = record as { locations?: unknown[] };
    return total + (item.locations?.length ?? 0);
  }, 0);
  const [researchCount, locationCount, evidenceCount, verifiedLocations, locations] =
    await Promise.all([
      prisma.clanResearch.count(),
      prisma.clanLocation.count(),
      prisma.clanLocationEvidence.count(),
      prisma.clanLocation.count({ where: { status: "verified" } }),
      prisma.clanLocation.findMany({
        select: { id: true, status: true, evidence: { select: { id: true } } },
      }),
    ]);

  const errors: string[] = [];
  if (researchCount !== generated.records.length) errors.push(`research count ${researchCount} !== generated ${generated.records.length}`);
  if (locationCount !== expectedLocationCount) errors.push(`location count ${locationCount} !== generated ${expectedLocationCount}`);
  if (verifiedLocations < 1000) errors.push(`verified locations ${verifiedLocations} < 1000`);
  if (locations.some((location) => location.status === "verified" && location.evidence.length === 0)) {
    errors.push("one or more verified locations have no evidence");
  }
  const ids = locations.map((location) => location.id);
  if (new Set(ids).size !== ids.length) errors.push("duplicate location ids");

  console.log(JSON.stringify({
    researchCount,
    locationCount,
    evidenceCount,
    verifiedLocations,
    locationsWithoutEvidence: locations.filter((location) => location.evidence.length === 0).length,
    valid: errors.length === 0,
    errors,
  }, null, 2));
  if (errors.length) process.exitCode = 1;
}

main().finally(() => prisma.$disconnect());
