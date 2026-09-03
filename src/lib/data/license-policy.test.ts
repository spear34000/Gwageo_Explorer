import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isRedistributableLicense } from "./license-policy";

describe("third-party data license policy", () => {
  it("allows licenses that permit commercial reuse and derivatives", () => {
    for (const license of ["KOGL-TYPE-1", "AKS-OWNED-FREE-USE", "CC0-1.0", "PDM-1.0", "CC-BY-4.0", "PUBLIC-DATA-NO-RESTRICTIONS", "ODBL-1.0"]) {
      assert.equal(isRedistributableLicense(license), true, license);
    }
  });

  it("blocks non-commercial, no-derivatives, and unknown licenses", () => {
    for (const license of [
      "KOGL-TYPE-2",
      "KOGL-TYPE-3",
      "KOGL-TYPE-4",
      "CC-BY-NC-4.0",
      "CC-BY-ND-4.0",
      "UNKNOWN",
      "",
    ]) {
      assert.equal(isRedistributableLicense(license), false, license);
    }
  });
});
