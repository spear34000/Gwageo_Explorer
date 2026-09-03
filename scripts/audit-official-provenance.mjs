import fs from "node:fs";
import path from "node:path";

const file = path.join(process.cwd(), "prisma", "clan-research.json");
const data = JSON.parse(fs.readFileSync(file, "utf8"));
const locations = data.records.flatMap((record) => record.locations ?? []);
const verified = locations.filter((location) => location.status === "verified");
const officialProviders = new Set([
  "한국학중앙연구원",
  "한국학중앙연구원·공공데이터포털",
  "국토교통부 국토지리정보원",
  "국사편찬위원회",
]);
const coordinateProviders = new Set([
  "국토교통부 국토지리정보원",
  "OpenStreetMap contributors",
]);
const providerDomains = {
  "한국학중앙연구원": ["encykorea.aks.ac.kr"],
  "한국학중앙연구원·공공데이터포털": ["data.go.kr"],
  "국토교통부 국토지리정보원": ["data.go.kr"],
  "국사편찬위원회": ["history.go.kr", "sillok.history.go.kr"],
  "OpenStreetMap contributors": ["openstreetmap.org"],
};
const errors = [];

for (const location of verified) {
  const providers = new Set((location.evidence ?? []).map((item) => item.provider));
  if (![...providers].some((provider) => officialProviders.has(provider))) {
    errors.push(`${location.id}: no recognized official source provider`);
  }
  if (![...providers].some((provider) => coordinateProviders.has(provider))) {
    errors.push(`${location.id}: no recognized coordinate provider`);
  }
  for (const item of location.evidence ?? []) {
    if (!officialProviders.has(item.provider) && !coordinateProviders.has(item.provider)) continue;
    let hostname;
    try {
      hostname = new URL(item.url).hostname.toLowerCase();
    } catch {
      errors.push(`${location.id}: invalid evidence URL`);
      continue;
    }
    const domains = providerDomains[item.provider] ?? [];
    if (!domains.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`))) {
      errors.push(`${location.id}: provider/domain mismatch for ${item.provider}`);
    }
  }
}

const result = {
  verifiedLocations: verified.length,
  officialProviderPolicy: [...officialProviders],
  coordinateProviderPolicy: [...coordinateProviders],
  errors,
  valid: errors.length === 0,
};
console.log(JSON.stringify(result, null, 2));
if (errors.length) process.exit(1);
