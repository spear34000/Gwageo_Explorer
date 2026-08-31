export type PlacePrecision = "settlement" | "county-center" | "regional-center";
export type PlaceConfidence = "verified" | "approximate";

export interface PlaceSource {
  title: string;
  url: string;
}

export interface HistoricalPlace {
  id: string;
  labels: readonly string[];
  bonGwanLabels?: readonly string[];
  hanja?: string;
  modernArea: string;
  coordinate: readonly [latitude: number, longitude: number];
  precision: PlacePrecision;
  confidence: PlaceConfidence;
  source: PlaceSource;
}

export type PlaceResolution =
  | { status: "resolved"; input: string; place: HistoricalPlace }
  | { status: "ambiguous"; input: string; candidates: readonly HistoricalPlace[] }
  | { status: "unknown"; input: string; reason: "empty" | "not-found" | "not-specific" };
