import fs from "node:fs";
import path from "node:path";
import {
  CLAN_RESEARCH_STATUSES,
  validateClanResearchDataset,
  type ClanResearchRecord,
} from "../src/lib/data/clan-research";

interface RealData { clans: Array<{ id: string; bonGwan: string; surname: string }> }
interface ResearchFile { records: ClanResearchRecord[] }

const root = process.cwd();
const realDataPath = path.join(root, "prisma", "real-data.json");
if (!fs.existsSync(realDataPath)) {
  console.log(JSON.stringify({ status: "skipped", reason: "prisma/real-data.json is an external, rights-gated dataset" }, null, 2));
  process.exit(0);
}
const data = JSON.parse(fs.readFileSync(realDataPath, "utf8")) as RealData;
const research = JSON.parse(fs.readFileSync(path.join(root, "prisma", "clan-research.json"), "utf8")) as ResearchFile;
const inventory = data.clans.map((clan) => clan.id);
const result = validateClanResearchDataset(research.records, inventory);
for (const record of research.records) {
  const hasVerifiedLocation = record.locations.some((location) => location.status === "verified");
  if (record.status === "verified" && !hasVerifiedLocation) result.errors.push(`${record.clanId}: verified record has no verified location`);
  if (record.status !== "verified" && hasVerifiedLocation) {
    const observationOnly = record.locations
      .filter((location) => location.status === "verified")
      .every((location) => location.note?.includes("본관 연고 자체는 별도 검증 대기"));
    if (!observationOnly) result.errors.push(`${record.clanId}: verified origin location on non-verified record`);
  }
}
result.valid = result.errors.length === 0;
const status = new Map<string, number>(CLAN_RESEARCH_STATUSES.map((name) => [name, 0]));
const locationStatus = new Map<string, number>(CLAN_RESEARCH_STATUSES.map((name) => [name, 0]));
let locationCount = 0;
for (const record of research.records) status.set(record.status, (status.get(record.status) ?? 0) + 1);
for (const record of research.records) {
  for (const location of record.locations) {
    locationCount += 1;
    locationStatus.set(location.status, (locationStatus.get(location.status) ?? 0) + 1);
  }
}
console.log(JSON.stringify({
  total: research.records.length,
  uniqueInventory: new Set(inventory).size,
  status: Object.fromEntries(status),
  statusSum: [...status.values()].reduce((sum, count) => sum + count, 0),
  locations: locationCount,
  locationStatus: Object.fromEntries(locationStatus),
  ...result,
}, null, 2));
if (!result.valid) process.exitCode = 1;
