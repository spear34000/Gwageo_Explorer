import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildMapModel } from "./map-model";

describe("historical map model", () => {
  it("groups exact resolved coordinates and preserves unresolved counts", () => {
    const model = buildMapModel({ bonGwan: "영천", residences: [
      { residence: "영천(榮川)", count: 12 }, { residence: "영천(永川)", count: 7 },
      { residence: "여주(驪州)", count: 4 }, { residence: "여주(驪州)", count: 3 },
      { residence: "미상(未詳)", count: 5 },
    ] });
    assert.equal(model.bonGwan.status, "ambiguous");
    assert.equal(model.markers.length, 3);
    const yeoju = model.markers.find((marker) => marker.place.id === "yeoju");
    assert.equal(yeoju?.count, 7);
    assert.equal(model.resolvedCount, 26);
    assert.equal(model.unresolvedCount, 5);
  });
  it("keeps provenance and confidence on marker data", () => {
    const model = buildMapModel({ bonGwan: "전주", residences: [{ residence: "전주(全州)", count: 2 }] });
    assert.equal(model.bonGwan.status, "resolved");
    assert.equal(model.markers[0]?.place.confidence, "approximate");
  });
});
