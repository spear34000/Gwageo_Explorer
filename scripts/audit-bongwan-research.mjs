import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const real = JSON.parse(fs.readFileSync(path.join(root, "prisma", "real-data.json"), "utf8"));
const research = JSON.parse(fs.readFileSync(path.join(root, "prisma", "clan-research.json"), "utf8"));

const inventory = new Map();
for (const clan of real.clans) {
  const list = inventory.get(clan.bonGwan) ?? [];
  list.push(clan.id);
  inventory.set(clan.bonGwan, list);
}

const recordsByBonGwan = new Map();
for (const record of research.records) {
  const list = recordsByBonGwan.get(record.bonGwan) ?? [];
  list.push(record);
  recordsByBonGwan.set(record.bonGwan, list);
}

const missing = [...inventory.keys()].filter((name) => !recordsByBonGwan.has(name)).sort();
const duplicateClanIds = research.records
  .map((record) => record.clanId)
  .filter((id, index, ids) => ids.indexOf(id) !== index);
const status = { verified: 0, ambiguous: 0, no_official_source: 0, outside_korea: 0, review_required: 0, license_blocked: 0 };
for (const records of recordsByBonGwan.values()) {
  if (records.some((record) => record.status === "verified")) status.verified += 1;
  else if (records.some((record) => record.status === "ambiguous")) status.ambiguous += 1;
  else if (records.some((record) => record.status === "outside_korea")) status.outside_korea += 1;
  else if (records.some((record) => record.status === "license_blocked")) status.license_blocked += 1;
  else if (records.some((record) => record.status === "review_required")) status.review_required += 1;
  else status.no_official_source += 1;
}

const result = {
  uniqueBonGwan: inventory.size,
  researchBonGwan: recordsByBonGwan.size,
  missingBonGwan: missing,
  duplicateClanIds: [...new Set(duplicateClanIds)].sort(),
  statusByBonGwan: status,
  valid: inventory.size === recordsByBonGwan.size && missing.length === 0 && duplicateClanIds.length === 0,
};
console.log(JSON.stringify(result, null, 2));
if (!result.valid) process.exitCode = 1;
