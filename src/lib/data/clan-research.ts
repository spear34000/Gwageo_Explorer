import { isRedistributableLicense } from "./license-policy";

export type ClanResearchStatus =
  | "verified"
  | "ambiguous"
  | "no_official_source"
  | "outside_korea"
  | "review_required"
  | "license_blocked";

export const CLAN_RESEARCH_STATUSES: readonly ClanResearchStatus[] = [
  "verified",
  "ambiguous",
  "no_official_source",
  "outside_korea",
  "review_required",
  "license_blocked",
];

const statusSet = new Set<string>(CLAN_RESEARCH_STATUSES);

export interface ClanLocationEvidence {
  id: string;
  provider: string;
  title: string;
  url: string;
  licenseCode: string;
  licenseUrl: string;
  retrievedAt: string;
  evidenceSummary: string;
  contentHash: string;
}

export interface ClanLocationRecord {
  id: string;
  kind: "origin" | "administrative" | "settlement";
  name: string;
  modernArea: string;
  latitude: number;
  longitude: number;
  status: ClanResearchStatus;
  note?: string;
  evidence: ClanLocationEvidence[];
}

export interface ClanResearchRecord {
  clanId: string;
  bonGwan: string;
  surname: string;
  status: ClanResearchStatus;
  note?: string;
  locations: ClanLocationRecord[];
}

export interface ClanResearchValidation {
  valid: boolean;
  missingClanIds: string[];
  duplicateClanIds: string[];
  errors: string[];
}

function validCoordinate(latitude: number, longitude: number): boolean {
  return Number.isFinite(latitude) && Number.isFinite(longitude) && latitude >= 30 && latitude <= 44 && longitude >= 123 && longitude <= 132;
}

export function isValidRedistributableEvidence(item: ClanLocationEvidence): boolean {
  return Boolean(
    item.id.trim()
      && item.provider.trim()
      && item.title.trim()
      && /^https:\/\//.test(item.url)
      && isRedistributableLicense(item.licenseCode)
      && /^https:\/\//.test(item.licenseUrl)
      && /^\d{4}-\d{2}-\d{2}$/.test(item.retrievedAt)
      && item.evidenceSummary.trim()
      && /^[0-9a-f]{64}$/i.test(item.contentHash),
  );
}

export function validateClanResearchDataset(
  records: readonly ClanResearchRecord[],
  inventoryClanIds: readonly string[],
): ClanResearchValidation {
  const errors: string[] = [];
  const counts = new Map<string, number>();
  for (const record of records) counts.set(record.clanId, (counts.get(record.clanId) ?? 0) + 1);
  const missingClanIds = inventoryClanIds.filter((id) => !counts.has(id));
  const duplicateClanIds = [...counts].filter(([, count]) => count > 1).map(([id]) => id).sort();
  if (missingClanIds.length) errors.push(`missing clan records: ${missingClanIds.join(", ")}`);
  if (duplicateClanIds.length) errors.push(`duplicate clan records: ${duplicateClanIds.join(", ")}`);

  for (const record of records) {
    if (!statusSet.has(record.status)) errors.push(`${record.clanId}: invalid research status`);
    for (const location of record.locations) {
      if (!statusSet.has(location.status)) errors.push(`${record.clanId}/${location.id}: invalid location status`);
      if (!validCoordinate(location.latitude, location.longitude)) errors.push(`${record.clanId}/${location.id}: invalid coordinate`);
      if (location.status !== "verified") continue;
      const compatible = location.evidence.some(isValidRedistributableEvidence);
      if (!compatible) errors.push(`${record.clanId}/${location.id}: verified location lacks compatible evidence`);
    }
  }
  return { valid: errors.length === 0, missingClanIds, duplicateClanIds, errors };
}

export function publicLocations(record: ClanResearchRecord): ClanLocationRecord[] {
  return record.locations.filter((location) => {
    if (location.status !== "verified") return false;
    return location.evidence.some(isValidRedistributableEvidence);
  });
}
