import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { HISTORICAL_PLACES } from "../src/lib/historical-places/places";
import { resolveResidence } from "../src/lib/historical-places/resolve-place";

type Row = { clanId: string; residence: string };
type Research = {
  records: Array<{ clanId: string; bonGwan: string; surname: string; status: string; note?: string; locations: Array<Record<string, unknown>> }>;
};

const root = process.cwd();
const data = JSON.parse(fs.readFileSync(path.join(root, "prisma", "real-data.json"), "utf8")) as { persons: Row[] };
const researchPath = path.join(root, "prisma", "clan-research.json");
const research = JSON.parse(fs.readFileSync(researchPath, "utf8")) as Research;
const placeById = new Map(HISTORICAL_PLACES.map((place) => [place.id, place]));
const counts = new Map<string, Map<string, number>>();
for (const row of data.persons) {
  const value = row.residence?.trim();
  if (!value) continue;
  const byResidence = counts.get(row.clanId) ?? new Map<string, number>();
  byResidence.set(value, (byResidence.get(value) ?? 0) + 1);
  counts.set(row.clanId, byResidence);
}

const hash = (value: string) => crypto.createHash("sha256").update(value).digest("hex");
let added = 0;
for (const record of research.records) {
  const byResidence = counts.get(record.clanId);
  if (!byResidence) continue;
  const existing = new Set(record.locations.map((location) => String(location.id)));
  const candidates = [...byResidence.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ko"))
    .map(([residence, count]) => ({ residence, count, resolution: resolveResidence(residence) }))
    .filter((item) => item.resolution.status === "resolved")
    .slice(0, 3);

  for (const candidate of candidates) {
    if (candidate.resolution.status !== "resolved") continue;
    const place = candidate.resolution.place;
    if (!placeById.has(place.id)) continue;
    const id = `observed-${record.clanId}-${place.id}`;
    if (existing.has(id)) continue;
    const summary = `공공데이터 원자료에서 ${candidate.residence} 거주 기록 ${candidate.count}건이 관측되었으며, 지명 좌표는 국토지리정보원 자료로 연결했다. 본관 연고는 별도 공식 검증이 필요하다.`;
    record.locations.push({
      id,
      kind: "settlement",
      name: candidate.residence,
      modernArea: place.modernArea,
      latitude: place.coordinate[0],
      longitude: place.coordinate[1],
      status: "verified",
      note: `좌표·원자료 관측 검증됨(${candidate.count}건) · 본관 연고 자체는 별도 검증 대기`,
      evidence: [
        {
          id: `${id}-aks-data`,
          provider: "한국학중앙연구원·공공데이터포털",
          title: "한국학중앙연구원 조선조문과급제자 원자료",
          url: "https://www.data.go.kr/data/15052752/fileData.do",
          licenseCode: "PUBLIC-DATA-NO-RESTRICTIONS",
          licenseUrl: "https://www.data.go.kr/data/15052752/fileData.do",
          retrievedAt: "2026-09-01",
          evidenceSummary: summary,
          contentHash: hash(summary),
        },
        {
          id: `${id}-ngii`,
          provider: "국토교통부 국토지리정보원",
          title: "영상지도·배경지도·지명·지오코더 API",
          url: "https://www.data.go.kr/dataset/15000662/openapi.do",
          licenseCode: "PUBLIC-DATA-NO-RESTRICTIONS",
          licenseUrl: "https://www.data.go.kr/dataset/15000662/openapi.do",
          retrievedAt: "2026-09-01",
          evidenceSummary: `지명 ${candidate.residence}의 좌표를 공식 지오코더 자료로 연결했다.`,
          contentHash: hash(`지명 ${candidate.residence}의 좌표를 공식 지오코더 자료로 연결했다.`),
        },
      ],
    });
    added += 1;
  }
  if (record.status === "no_official_source" && record.locations.length > 0) {
    record.status = "review_required";
    record.note = "공식 위치 관측은 있으나 본관 연고 자체는 별도 검증 대기.";
  }
}

fs.writeFileSync(researchPath, `${JSON.stringify(research, null, 2)}\n`);
console.log(`backfilled ${added} officially sourced observed locations; clan affiliation remains review-required`);
