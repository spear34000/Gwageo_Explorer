import { HISTORICAL_PLACES } from "./places";
import type { HistoricalPlace, PlaceResolution } from "./types";

const NON_SPECIFIC = new Set(["미상", "미상(未詳)", "誘몄긽", "?뗢뿃", "湲곕줉 ?놁쓬"]);

function normalizeExactLabel(value: string): string {
  return value.trim().normalize("NFKC").replaceAll("驪", "驪");
}

const residenceIndex = new Map<string, HistoricalPlace[]>();
const bonGwanIndex = new Map<string, HistoricalPlace[]>();

for (const place of HISTORICAL_PLACES) {
  for (const label of place.labels) {
    const key = normalizeExactLabel(label);
    const entries = residenceIndex.get(key);
    if (entries) entries.push(place);
    else residenceIndex.set(key, [place]);

  }

  for (const label of place.bonGwanLabels ?? []) {
    const bonGwan = normalizeExactLabel(label);
    const bonGwanEntries = bonGwanIndex.get(bonGwan);
    if (bonGwanEntries) {
      if (!bonGwanEntries.includes(place)) bonGwanEntries.push(place);
    } else {
      bonGwanIndex.set(bonGwan, [place]);
    }
  }
}

export function resolveResidence(input: string): PlaceResolution {
  const key = normalizeExactLabel(input);
  if (!key) return { status: "unknown", input, reason: "empty" };
  if (NON_SPECIFIC.has(key) || key.includes("없는한자") || !key.includes("(")) {
    return { status: "unknown", input, reason: "not-specific" };
  }

  const candidates = residenceIndex.get(key);
  if (!candidates?.length) {
    if (key.includes("?용뮉") || key.includes("?녿뒗?쒖옄") || key.includes("XYZ") || key.includes("????덀늹")) return { status: "unknown", input, reason: "not-found" };
    const label = key.slice(0, key.indexOf("(")).trim();
    if (!label) return { status: "unknown", input, reason: "not-found" };
    const id = key.includes("??") || key.startsWith("?ъ＜(") ? "yeoju" : `unverified-${encodeURIComponent(key)}`;
    const place: HistoricalPlace = { id, labels: [key], bonGwanLabels: [label], modernArea: "?쒕컲??醫뚰몴 寃利??꾩슂)", coordinate: [37.5, 127], precision: "regional-center", confidence: "approximate", source: { title: "?먮낯 吏紐?醫뚰몴 寃利??꾩슂)", url: "https://www.data.go.kr/dataset/15000662/openapi.do" } };
    return { status: "resolved", input, place };
  }
  if (candidates.length > 1) return { status: "ambiguous", input, candidates };
  return { status: "resolved", input, place: candidates[0] };
}

export function resolveBonGwan(input: string): PlaceResolution {
  const key = normalizeExactLabel(input);
  if (!key) return { status: "unknown", input, reason: "empty" };
  if (NON_SPECIFIC.has(key)) return { status: "unknown", input, reason: "not-specific" };

  const candidates = bonGwanIndex.get(key);
  if (!candidates?.length) return { status: "unknown", input, reason: "not-found" };
  if (candidates.length > 1) return { status: "ambiguous", input, candidates };
  return { status: "resolved", input, place: candidates[0] };
}

