import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isValidRedistributableEvidence,
  publicLocations,
  validateClanResearchDataset,
  type ClanResearchRecord,
} from "./clan-research";

const evidence = {
  id: "evidence-1",
  provider: "공공기관",
  title: "공식 지명 항목",
  url: "https://example.go.kr/place/1",
  licenseCode: "KOGL-TYPE-1",
  licenseUrl: "https://www.kogl.or.kr/info/licenseType1.do",
  retrievedAt: "2026-09-01",
  evidenceSummary: "공식 항목에서 지명과 위치를 확인함.",
  contentHash: "a".repeat(64),
};

describe("clan research dataset", () => {
  it("requires every inventory clan exactly once", () => {
    const records: ClanResearchRecord[] = [
      { clanId: "전주-이", bonGwan: "전주", surname: "이", status: "review_required", locations: [] },
    ];

    const result = validateClanResearchDataset(records, ["전주-이", "풍천-임"]);
    assert.deepEqual(result.missingClanIds, ["풍천-임"]);
    assert.deepEqual(result.duplicateClanIds, []);
    assert.equal(result.valid, false);
  });

  it("rejects verified locations without compatible official evidence", () => {
    const records: ClanResearchRecord[] = [{
      clanId: "전주-이",
      bonGwan: "전주",
      surname: "이",
      status: "verified",
      locations: [{
        id: "jeonju-origin",
        kind: "origin",
        name: "전주",
        modernArea: "전북특별자치도 전주시",
        latitude: 35.8242,
        longitude: 127.148,
        status: "verified",
        evidence: [{ ...evidence, licenseCode: "CC-BY-NC-4.0" }],
      }],
    }];

    const result = validateClanResearchDataset(records, ["전주-이"]);
    assert.equal(result.valid, false);
    assert.match(result.errors[0] ?? "", /compatible evidence/);
  });

  it("only exposes verified locations backed by redistributable evidence", () => {
    const record: ClanResearchRecord = {
      clanId: "전주-이",
      bonGwan: "전주",
      surname: "이",
      status: "verified",
      locations: [
        {
          id: "verified",
          kind: "origin",
          name: "전주",
          modernArea: "전북특별자치도 전주시",
          latitude: 35.8242,
          longitude: 127.148,
          status: "verified",
          evidence: [evidence],
        },
        {
          id: "reported",
          kind: "settlement",
          name: "제보 위치",
          modernArea: "경기도",
          latitude: 37.5,
          longitude: 127,
          status: "review_required",
          evidence: [],
        },
      ],
    };

    assert.deepEqual(publicLocations(record).map((location) => location.id), ["verified"]);
  });

  it("rejects malformed status values at the JSON boundary", () => {
    const records = [{
      clanId: "전주-이",
      bonGwan: "전주",
      surname: "이",
      status: "pending",
      locations: [],
    }] as unknown as ClanResearchRecord[];

    const result = validateClanResearchDataset(records, ["전주-이"]);
    assert.equal(result.valid, false);
    assert.match(result.errors[0] ?? "", /invalid research status/);
  });

  it("requires dated, hashed evidence for a verified location", () => {
    assert.equal(isValidRedistributableEvidence({ ...evidence, retrievedAt: "2026-09-01T00:00:00.000Z" }), false);
    assert.equal(isValidRedistributableEvidence({ ...evidence, contentHash: "" }), false);
    assert.equal(isValidRedistributableEvidence(evidence), true);
  });
});
