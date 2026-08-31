import { resolveBonGwan, resolveResidence } from "./resolve-place";
import type { HistoricalPlace, PlaceResolution } from "./types";

export interface ResidenceCount {
  residence: string;
  count: number;
}

export interface HistoricalMapMarker {
  place: HistoricalPlace;
  residences: ResidenceCount[];
  count: number;
}

export interface UnresolvedResidence extends ResidenceCount {
  status: "ambiguous" | "unknown";
}

export interface HistoricalMapModel {
  bonGwan: PlaceResolution;
  markers: HistoricalMapMarker[];
  unresolvedResidences: UnresolvedResidence[];
  resolvedCount: number;
  unresolvedCount: number;
}

interface BuildMapModelInput {
  bonGwan: string;
  residences: readonly ResidenceCount[];
}

export function buildMapModel({ bonGwan, residences }: BuildMapModelInput): HistoricalMapModel {
  const markersByPlace = new Map<string, HistoricalMapMarker>();
  const unresolvedResidences: UnresolvedResidence[] = [];
  let resolvedCount = 0;
  let unresolvedCount = 0;

  for (const residence of residences) {
    const resolution = resolveResidence(residence.residence);
    if (resolution.status !== "resolved") {
      unresolvedResidences.push({ ...residence, status: resolution.status });
      unresolvedCount += residence.count;
      continue;
    }

    resolvedCount += residence.count;
    const existing = markersByPlace.get(resolution.place.id);
    if (existing) {
      existing.residences.push(residence);
      existing.count += residence.count;
    } else {
      markersByPlace.set(resolution.place.id, {
        place: resolution.place,
        residences: [residence],
        count: residence.count,
      });
    }
  }

  return {
    bonGwan: resolveBonGwan(bonGwan),
    markers: [...markersByPlace.values()].filter((marker) => !marker.place.id.startsWith("unverified-")),
    unresolvedResidences,
    resolvedCount,
    unresolvedCount,
  };
}
