import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { HISTORICAL_PLACES } from "./places";

describe("historical gazetteer invariants", () => {
  it("keeps unique identifiers and exact labels", () => {
    const ids = new Set<string>();
    const labels = new Map<string, string>();

    for (const place of HISTORICAL_PLACES) {
      assert.ok(!ids.has(place.id), `duplicate id: ${place.id}`);
      ids.add(place.id);

      for (const label of place.labels) {
        const normalized = label.trim().normalize("NFKC");
        const owner = labels.get(normalized);
        assert.ok(!owner || owner === place.id, `duplicate exact label: ${label} (${owner}, ${place.id})`);
        labels.set(normalized, place.id);
      }
    }
  });

  it("requires bounded coordinates and complete provenance", () => {
    for (const place of HISTORICAL_PLACES) {
      const [latitude, longitude] = place.coordinate;
      assert.ok(latitude >= 30 && latitude <= 44, `${place.id}: invalid latitude ${latitude}`);
      assert.ok(longitude >= 123 && longitude <= 132, `${place.id}: invalid longitude ${longitude}`);
      assert.ok(place.modernArea.trim(), `${place.id}: missing modern area`);
      assert.ok(place.labels.length > 0, `${place.id}: missing exact label`);
      assert.match(place.source.url, /^https:\/\//, `${place.id}: invalid source URL`);
      assert.ok(["verified", "approximate"].includes(place.confidence), `${place.id}: invalid confidence`);
      assert.ok(["settlement", "county-center", "regional-center"].includes(place.precision), `${place.id}: invalid precision`);
    }
  });
});
