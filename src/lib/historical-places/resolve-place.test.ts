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
    for (const input of ["", "미상", "○○", "기록 없음", "영천", "영천(없는한자)", "광주XYZ"]) {
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

  it("resolves the highest-frequency historical residences across both Koreas", () => {
    const inputs = [
      "남원(南原)", "강화(江華)", "안악(安岳)", "성주(星州)",
      "남양(南陽)", "죽산(竹山)", "중화(中和)", "안주(安州)",
      "진천(鎭川)", "장흥(長興)", "양근(楊根)", "신천(信川)",
      "예천(醴泉)", "배천(白川)", "의성(義城)", "보성(寶城)",
      "장단(長湍)", "북청(北靑)", "강진(康津)", "순창(淳昌)",
    ];

    for (const input of inputs) assert.equal(resolveResidence(input).status, "resolved", input);
  });

  it("resolves the next high-frequency county seats without collapsing Hanja homonyms", () => {
    const inputs = [
      "부안(扶安)", "영암(靈巖)", "예안(禮安)", "옥천(沃川)", "보령(保寧)",
      "영광(靈光)", "양성(陽城)", "진위(振威)", "장성(長城)", "회덕(懷德)",
      "고양(高陽)", "용강(龍岡)", "보은(報恩)", "영변(寧邊)", "풍덕(豊德)",
      "아산(牙山)", "부평(富平)", "영유(永柔)", "함양(咸陽)", "천안(天安)",
      "목천(木川)", "창평(昌平)", "충원(忠原)", "선천(宣川)", "통진(通津)",
      "철산(鐵山)", "흥양(興陽)", "강동(江東)", "숙천(肅川)", "경성(鏡城)",
      "성천(成川)", "태인(泰仁)", "서산(瑞山)", "함평(咸平)", "횡성(橫城)",
      "서흥(瑞興)", "용궁(龍宮)", "연산(連山)", "문의(文義)", "영흥(永興)",
      "인동(仁同)", "고부(古阜)", "과천(果川)", "단성(丹城)", "함창(咸昌)",
      "김제(金堤)", "영해(寧海)", "대흥(大興)",
    ];

    for (const input of inputs) assert.equal(resolveResidence(input).status, "resolved", input);

    const gimcheon = resolveResidence("금산(金山)");
    const geumsan = resolveResidence("금산(錦山)");
    assert.equal(gimcheon.status, "resolved");
    assert.equal(geumsan.status, "resolved");
    if (gimcheon.status === "resolved" && geumsan.status === "resolved") {
      assert.notEqual(gimcheon.place.id, geumsan.place.id);
    }
  });

  it("resolves additional Joseon county seats from the audited real vocabulary", () => {
    const inputs = [
      "지평(砥平)", "상원(祥原)", "합천(陜川)", "풍기(豊基)", "청도(淸道)",
      "괴산(槐山)", "수안(遂安)", "강서(江西)", "능주(綾州)", "면천(沔川)",
      "부여(扶餘)", "울산(蔚山)", "예산(禮山)", "함종(咸從)", "남포(藍浦)",
      "안산(安山)", "임천(林川)", "교하(交河)", "익산(益山)", "박천(博川)",
      "임실(任實)", "결성(結城)", "덕산(德山)", "무안(務安)", "서원(西原)",
      "니산(尼山)", "의령(宜寧)", "해미(海美)", "고령(高靈)", "영동(永同)",
      "음죽(陰竹)", "직산(稷山)", "태천(泰川)", "순안(順安)", "삼화(三和)",
      "개천(价川)", "가산(嘉山)", "임피(臨陂)", "장련(長連)", "장연(長淵)",
      "제천(堤川)", "현풍(玄風)", "종성(鍾城)", "청안(淸安)", "용천(龍川)",
      "함안(咸安)", "거창(居昌)", "정평(定平)", "송화(松禾)",
    ];

    for (const input of inputs) assert.equal(resolveResidence(input).status, "resolved", input);
  });
});
