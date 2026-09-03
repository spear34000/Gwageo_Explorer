import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveBonGwan, resolveResidence } from "./resolve-place";

describe("historical place resolver", () => {
  it("keeps same-sounding places with different Hanja separate", () => {
    const cases = [
      ["영천(榮川)", "yeongcheon-yeongju"],
      ["영천(永川)", "yeongcheon-city"],
      ["광주(廣州)", "gwangju-gyeonggi"],
      ["광주(光州)", "gwangju-jeolla"],
      ["순천(順天)", "suncheon-jeolla"],
      ["순천(順川)", "sunchon-pyongan"],
      ["고성(固城)", "goseong-gyeongsang"],
      ["고성(高城)", "goseong-gangwon"],
    ] as const;

    for (const [input, expectedId] of cases) {
      const result = resolveResidence(input);
      assert.equal(result.status, "resolved", input);
      if (result.status === "resolved") assert.equal(result.place.id, expectedId, input);
    }
  });

  it("normalizes Unicode compatibility ideographs without merging real homonyms", () => {
    const compatiblePairs = [
      ["여주(驪州)", "여주(驪州)"],
      ["용인(龍仁)", "용인(龍仁)"],
      ["재령(載寧)", "재령(載寧)"],
    ] as const;

    for (const [left, right] of compatiblePairs) {
      const a = resolveResidence(left);
      const b = resolveResidence(right);
      assert.equal(a.status, "resolved", left);
      assert.equal(b.status, "resolved", right);
      if (a.status === "resolved" && b.status === "resolved") {
        assert.equal(a.place.id, b.place.id);
      }
    }
  });

  it("does not guess unknown or insufficiently specific values", () => {
    for (const input of ["", "미상", "○○", "기록 없음", "영천", "영천(없는한자)", "광주XYZ", "가공현(架空縣)"]) {
      assert.equal(resolveResidence(input).status, "unknown", input);
    }
  });

  it("resolves a unique bon-gwan but exposes homonyms as ambiguous", () => {
    const unique = resolveBonGwan("여주");
    assert.equal(unique.status, "resolved");
    if (unique.status === "resolved") assert.equal(unique.place.id, "yeoju");

    for (const input of ["광주", "영천", "순천", "고성"]) {
      const result = resolveBonGwan(input);
      assert.equal(result.status, "ambiguous", input);
      if (result.status === "ambiguous") assert.ok(result.candidates.length > 1, input);
    }

    assert.equal(resolveBonGwan("미상").status, "unknown");
    assert.equal(resolveBonGwan("없는본관").status, "unknown");
  });

  it("resolves only entries present in the audited gazetteer", () => {
    for (const input of ["남원(南原)", "강화(江華)", "안악(安岳)", "진천(鎭川)", "예천(醴泉)", "의성(義城)", "강진(康津)", "순창(淳昌)", "지평(砥平)"]) {
      assert.equal(resolveResidence(input).status, "resolved", input);
    }
    for (const input of ["성주(星州)", "영암(靈巖)", "상원(祥原)", "합천(陜川)"]) {
      assert.equal(resolveResidence(input).status, "unknown", input);
    }
  });
});
