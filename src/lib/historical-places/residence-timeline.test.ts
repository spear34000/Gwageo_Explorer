import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { countRecordsThroughYear, countResidenceRecordsThroughYear, getMapYearRange, summarizeResidencesThroughYear } from "./residence-timeline";

describe("residence timeline", () => {
  const rows = [
    { year: 1450, residence: "한성([京])" },
    { year: 1500, residence: "한성([京])" },
    { year: 1490, residence: "전주(全州)" },
    { year: 1600, residence: "" },
  ];

  it("counts records through the inclusive selected year", () => {
    assert.deepEqual(summarizeResidencesThroughYear(rows, 1500), [
      { residence: "한성([京])", count: 2 },
      { residence: "전주(全州)", count: 1 },
    ]);
  });

  it("counts mappable records through the inclusive selected year", () => {
    assert.equal(countResidenceRecordsThroughYear(rows, 1449), 0);
    assert.equal(countResidenceRecordsThroughYear(rows, 1490), 2);
    assert.equal(countResidenceRecordsThroughYear(rows, 1500), 3);
  });

  it("keeps the legacy count helper equivalent", () => {
    assert.equal(countRecordsThroughYear(rows, 1500), countResidenceRecordsThroughYear(rows, 1500));
  });

  it("computes stable range defaults without spreading a large array", () => {
    assert.deepEqual(getMapYearRange(rows), { min: 1450, max: 1600 });
    assert.deepEqual(getMapYearRange([]), { min: 1392, max: 1910 });
  });
});
