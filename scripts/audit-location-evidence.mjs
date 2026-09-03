import fs from "node:fs";
import path from "node:path";

const file = path.join(process.cwd(), "prisma", "clan-research.json");
const data = JSON.parse(fs.readFileSync(file, "utf8"));
const locations = data.records.flatMap((record) => record.locations.map((location) => ({ ...location, clanId: record.clanId })));
const verified = locations.filter((location) => location.status === "verified");
const ids = new Set();
const errors = [];
for (const location of verified) {
  if (ids.has(location.id)) errors.push(`${location.id}: duplicate location id`);
  ids.add(location.id);
  if (!Number.isFinite(location.latitude) || location.latitude < 30 || location.latitude > 44) errors.push(`${location.id}: latitude out of Korea bounds`);
  if (!Number.isFinite(location.longitude) || location.longitude < 123 || location.longitude > 132) errors.push(`${location.id}: longitude out of Korea bounds`);
  const compatible = (location.evidence ?? []).some((item) =>
    /^https:\/\//.test(item.url)
    && /^https:\/\//.test(item.licenseUrl)
    && /^(PUBLIC-DATA-NO-RESTRICTIONS|AKS-OWNED-FREE-USE|KOGL-TYPE-1|CC0-1\.0|PDM-1\.0|CC-BY-[34]\.0|ODBL-1\.0)$/i.test(item.licenseCode)
    && /^\d{4}-\d{2}-\d{2}$/.test(item.retrievedAt)
    && /^[0-9a-f]{64}$/i.test(item.contentHash ?? "")
    && item.provider?.trim() && item.title?.trim() && item.evidenceSummary?.trim(),
  );
  if (!compatible) errors.push(`${location.id}: missing redistributable evidence`);
}
if (verified.length < 1000) errors.push(`verified location count ${verified.length} is below the 1000 release floor`);
const result = { records: data.records.length, locations: locations.length, verified: verified.length, uniqueVerifiedIds: ids.size, errors, valid: errors.length === 0 };
console.log(JSON.stringify(result, null, 2));
if (errors.length) process.exit(1);
