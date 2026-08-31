/**
 * AKS 실데이터 수집 스크립트
 *
 * 출처: 한국학중앙연구원 한국역대인물종합정보시스템 과거·취재 데이터
 *       (dh.aks.ac.kr, 이용재 편) - 문과/무과/생원/진사 방목 + 친속 데이터
 *
 * 1) 노드 파일 4종(mun/mu/saengwon/jinsa)을 읽어 인물 병합 + 합격 기록 생성
 *    - 인물 병합 키: 성씨 + 본관 + 이름
 *    - 시험 연도: nid(PMn_1393_000001 → 1393)
 *    - 등급: 연도별 nid 순번에서 파생 (갑과 1-3위 / 을과 4-10위 / 병과 11위~, 사마: N등)
 *      ※ 원본 방목에 등급 필드가 없어 순번 기준으로 근사한다
 *    - 왕: 시험 연도를 재위 연도에 매핑
 * 2) 친속 관계 추출
 *    - kin-mun: New_ID가 실제 급제자(PMn_)인 엣지 (부/조부/증조부/외조부/장인)
 *      (+M 자기참조, 고려 PCm_ 제외)
 *    - kin-mu, kin-sama: A1(부) 엣지의 이름+본관을 합격자 DB와 정확 일치
 *      (G/H 등은 의미가 불확실하고 이름이 불완전해 제외)
 * 3) prisma/real-data.json으로 출력
 *
 * 실행: node scripts/ingest-real-data.mjs (프로젝트 루트에서)
 */

import XLSX from "xlsx";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const DATA_DIR =
  process.env.AKS_DATA_DIR || "C:/Users/spear/AppData/Local/Temp/opencode/aks-data";
const OUT = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "prisma",
  "real-data.json",
);

// kings.ts와 동일한 목록 (스크립트 단독 실행을 위해 인라인)
const KINGS = [
  { id: "taejo", reignStart: 1392, reignEnd: 1398 },
  { id: "jeongjong", reignStart: 1398, reignEnd: 1400 },
  { id: "taejong", reignStart: 1400, reignEnd: 1418 },
  { id: "sejong", reignStart: 1418, reignEnd: 1450 },
  { id: "munjong", reignStart: 1450, reignEnd: 1452 },
  { id: "danjong", reignStart: 1452, reignEnd: 1455 },
  { id: "sejo", reignStart: 1455, reignEnd: 1468 },
  { id: "yejong", reignStart: 1468, reignEnd: 1469 },
  { id: "seongjong", reignStart: 1469, reignEnd: 1494 },
  { id: "yeonsangun", reignStart: 1494, reignEnd: 1506 },
  { id: "jungjong", reignStart: 1506, reignEnd: 1544 },
  { id: "injong", reignStart: 1544, reignEnd: 1545 },
  { id: "myeongjong", reignStart: 1545, reignEnd: 1567 },
  { id: "seonjo", reignStart: 1567, reignEnd: 1608 },
  { id: "gwanghaegun", reignStart: 1608, reignEnd: 1623 },
  { id: "injo", reignStart: 1623, reignEnd: 1649 },
  { id: "hyojong", reignStart: 1649, reignEnd: 1659 },
  { id: "hyeonjong", reignStart: 1659, reignEnd: 1674 },
  { id: "sukjong", reignStart: 1674, reignEnd: 1720 },
  { id: "gyeongjong", reignStart: 1720, reignEnd: 1724 },
  { id: "yeongjo", reignStart: 1724, reignEnd: 1776 },
  { id: "jeongjo", reignStart: 1776, reignEnd: 1800 },
  { id: "sunjo", reignStart: 1800, reignEnd: 1834 },
  { id: "heonjong", reignStart: 1834, reignEnd: 1849 },
  { id: "cheoljong", reignStart: 1849, reignEnd: 1863 },
  { id: "gojong", reignStart: 1863, reignEnd: 1894 },
];

function kingOfYear(year) {
  for (const k of KINGS) {
    if (year >= k.reignStart && year <= k.reignEnd) return k.id;
  }
  return "";
}

/** "김(金)" → "김", "김해(金海)" → "김해", "전주이씨(全州李氏)" → "전주이씨" */
function stripParens(v) {
  if (!v) return "";
  const s = String(v).trim();
  const i = s.search(/[(\[]/);
  return (i === -1 ? s : s.slice(0, i)).trim();
}

/**
 * 본관 정규화: "전주이씨" → "전주", "김해김씨" → "김해", "경주김" → "경주".
 * "씨"가 붙은 경우(또는 성씨가 끝에 붙은 경우) 성씨를 제거한다.
 * 본관 자체가 성씨로 끝나는 경우("이천이씨" → "이천")에도 안전하다.
 */
function normalizeBonGwan(clanStr, surname) {
  let b = stripParens(clanStr);
  if (!b) return "미상";
  if (b.endsWith("씨")) {
    b = b.slice(0, -1);
    if (surname && b.endsWith(surname) && b.length > surname.length) {
      b = b.slice(0, -surname.length);
    }
  } else if (surname && b.endsWith(surname) && b.length > surname.length) {
    b = b.slice(0, -surname.length);
  }
  return b || "미상";
}

function parseYearCol(v) {
  if (!v) return undefined;
  const n = parseInt(String(v), 10);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

/** 헤더 이름 → 컬럼 인덱스 (정확 일치 우선, 없으면 부분 일치) */
function headerIndex(row, names) {
  // 1차: 정확 일치 ("name"이 "full_name"을 오매칭하지 않도록)
  for (let i = 0; i < row.length; i++) {
    const h = String(row[i] || "").trim();
    if (names.some((n) => h === n)) return i;
  }
  // 2차: 부분 일치 ("full_name"만 있는 파일 등)
  for (let i = 0; i < row.length; i++) {
    const h = String(row[i] || "").trim();
    if (names.some((n) => h.includes(n))) return i;
  }
  return -1;
}

function readSheet(file, sheetName) {
  const wb = XLSX.readFile(path.join(DATA_DIR, file));
  const ws = wb.Sheets[sheetName || wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
}

// ---------- 1) 노드 파일 파싱 ----------

const NODE_FILES = [
  { file: "mun.xlsx", type: "mun" },
  { file: "mu.xlsx", type: "mu" },
  { file: "saengwon.xlsx", type: "saengwon" },
  { file: "jinsa.xlsx", type: "jinsa" },
];

const persons = []; // { id, name, surname, bonGwan, clanId, residence, birthYear, deathYear }
const exams = []; // { id, personId, type, year, kingId, grade }
const personByKey = new Map();
const examPersonByNid = new Map(); // bare nid → personId
const examIdByNid = new Map(); // bare nid → exam id
const nidOwner = new Map(); // bare nid → set of types (충돌 검사)
let skippedEmpty = 0;

function personKey(surname, bonGwan, name) {
  return `${surname}|${bonGwan}|${name}`;
}

function slugClan(bonGwan, surname) {
  return `${bonGwan || "미상"}-${surname}`;
}

function clanDisplayName(bonGwan, surname) {
  return bonGwan && bonGwan !== "미상"
    ? `${bonGwan} ${surname}씨`
    : `${surname}씨 (본관 미상)`;
}

for (const { file, type } of NODE_FILES) {
  const rows = readSheet(file);
  const header = rows[0];
  const iNid = headerIndex(header, ["nid"]);
  const iName = headerIndex(header, ["name"]);
  const iFull = headerIndex(header, ["full_name"]);
  const iChi = headerIndex(header, ["chi_name"]);
  const iBirth = headerIndex(header, ["birth_year"]);
  const iDeath = headerIndex(header, ["death_year"]);
  const iSurname = headerIndex(header, ["surname"]);
  const iClan = headerIndex(header, ["clan"]);
  const iRes = headerIndex(header, ["residence"]);

  // 연도별 순위를 매기기 위해 (year, seq) 수집
  const yearRows = new Map(); // year → [{seq, rowIdx}]
  const parsed = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const nid = String(row[iNid] || "").trim();
    const m = nid.match(/^P(Mn|Mu|Sa)_(\d{4})_(\d+)/);
    if (!m) continue;
    const year = parseInt(m[2], 10);
    const seq = parseInt(m[3], 10);
    const name = stripParens(
      String(row[iName] || "").trim() ||
        String(row[iFull] || "").trim() ||
        String(row[iChi] || "").trim(),
    );
    if (!name) {
      skippedEmpty++;
      continue;
    }
    const surname = stripParens(row[iSurname]) || "?";
    const bonGwan = normalizeBonGwan(row[iClan], surname);
    const residence = String(row[iRes] || "").trim();
    const birthYear = parseYearCol(row[iBirth]);
    const deathYear = parseYearCol(row[iDeath]);

    parsed.push({
      nid,
      year,
      seq,
      name,
      surname,
      bonGwan,
      residence,
      birthYear,
      deathYear,
    });
    if (!yearRows.has(year)) yearRows.set(year, []);
    yearRows.get(year).push({ seq, idx: parsed.length - 1 });

    const owners = nidOwner.get(nid) ?? new Set();
    owners.add(type);
    nidOwner.set(nid, owners);
  }

  // 등급 파생 (연도별 순번 → 갑과 3 / 을과 7 / 병과 나머지, 범주 내 순위)
  for (const [, list] of yearRows) {
    list.sort((a, b) => a.seq - b.seq);
    const isMun = type === "mun" || type === "mu";
    list.forEach(({ idx }, rank) => {
      const rec = parsed[idx];
      rec.grade = isMun
        ? rank < 3
          ? `갑과 ${rank + 1}위`
          : rank < 10
            ? `을과 ${rank - 2}위`
            : `병과 ${rank - 9}위`
        : `${rank + 1}등`;
    });
  }

  for (const rec of parsed) {
    const key = personKey(rec.surname, rec.bonGwan, rec.name);
    let person = personByKey.get(key);
    if (!person) {
      person = {
        id: `p-${persons.length + 1}`,
        name: rec.name,
        surname: rec.surname,
        bonGwan: rec.bonGwan,
        clanId: slugClan(rec.bonGwan, rec.surname),
        residence: rec.residence,
        birthYear: rec.birthYear,
        deathYear: rec.deathYear,
      };
      personByKey.set(key, person);
      persons.push(person);
    } else {
      if (!person.residence && rec.residence) person.residence = rec.residence;
      if (!person.birthYear && rec.birthYear) person.birthYear = rec.birthYear;
      if (!person.deathYear && rec.deathYear) person.deathYear = rec.deathYear;
    }

    const examId = `${type}-${rec.nid}`; // saengwon/jinsa의 PSa_ 접두사 충돌 대비
    exams.push({
      id: examId,
      personId: person.id,
      type,
      year: rec.year,
      kingId: kingOfYear(rec.year),
      grade: rec.grade,
    });
    examPersonByNid.set(rec.nid, person.id);
    examIdByNid.set(rec.nid, examId);
  }
}

// nid 충돌 통계
const collided = [...nidOwner.entries()].filter(([, s]) => s.size > 1);
console.log(
  `node: ${persons.length} persons, ${exams.length} exams, ${collided.length} nid collisions, ${skippedEmpty} empty-name rows skipped`,
);

// ---------- 2) 친속 관계 파싱 ----------
// 전략: 원본 방목의 친속 데이터는 대부분 "부 미상"으로 기록되어
// 자기참조(+M 또는 자신의 nid) 엣지다. 실제로 활용 가능한 엣지는
//   a) kin-mun: New_ID가 실제 급제자(PMn_)인 엣지 (부/조부/증조부/외조부/장인)
//   b) kin-mu, kin-sama: A1(부) 엣지의 이름+본관을 합격자 DB와 정확 일치
// G/H(무과·사마 형제/후손 추정)는 의미가 불확실하고 이름이 불완전해 제외한다.

const SUFFIX_MAP = {
  A1: "father",
  B1: "grandfather",
  C1: "great-grandfather",
  D1: "maternal-grandfather",
  F1: "father-in-law",
};
const REVERSE_MAP = {
  father: "son",
  grandfather: "grandson",
  "great-grandfather": "great-grandson",
  "maternal-grandfather": "maternal-grandson",
  "father-in-law": "son-in-law",
};

const relations = [];
const relationKeys = new Set();
let relSkippedSelf = 0;
let relSkippedForeign = 0;
const relCountByType = {};

function addRelation(p1, p2, type) {
  const key = `${p1}|${p2}|${type}`;
  if (relationKeys.has(key)) return;
  relationKeys.add(key);
  relations.push({ personId: p1, relatedPersonId: p2, type });
  relCountByType[type] = (relCountByType[type] ?? 0) + 1;
}

// a) kin-mun: id 연결 엣지
const kinRows = readSheet("kin-mun.xlsx");
const kinHeader = kinRows[0];
const kiNid = headerIndex(kinHeader, ["nid"]);
const kiNew = headerIndex(kinHeader, ["New_ID"]);

for (let r = 1; r < kinRows.length; r++) {
  const row = kinRows[r];
  const nid = String(row[kiNid] || "").trim();
  const m = nid.match(/^PMn_(\d{4})_(\d+)_(A1|B1|C1|D1|F1)(\+M)?$/);
  if (!m) continue; // 지원하지 않는 접미사(A2/F2/F3/F4 등) 제외
  const baseNid = `PMn_${m[1]}_${m[2]}`;
  const suffix = m[3];
  const isSelf = !!m[4];

  const egoPerson = examPersonByNid.get(baseNid);
  if (!egoPerson) continue;

  const newId = String(row[kiNew] || "").trim();
  if (isSelf || newId.endsWith("+M")) {
    relSkippedSelf++;
    continue;
  }
  const kinM = newId.match(/^PMn_\d{4}_\d+$/);
  if (!kinM) {
    relSkippedForeign++; // PCm_ 고려 등 외부 노드
    continue;
  }
  const kinPerson = examPersonByNid.get(newId);
  if (!kinPerson) continue;

  const type = SUFFIX_MAP[suffix];
  addRelation(egoPerson, kinPerson, type);
  addRelation(kinPerson, egoPerson, REVERSE_MAP[type]);
}

// b) kin-mu, kin-sama: A1(부) 이름+본관 일치 엣지
function matchKinFathers(file) {
  const rows = readSheet(file);
  const header = rows[0];
  const iNid = headerIndex(header, ["nid"]);
  const iName = headerIndex(header, ["name"]);
  const iFull = headerIndex(header, ["full_name"]);
  const iSurname = headerIndex(header, ["surname"]);
  const iClan = headerIndex(header, ["clan"]);
  let matched = 0;

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const nid = String(row[iNid] || "").trim();
    const m = nid.match(/^P(Mu|Sa)_(\d{4})_(\d+)_A1$/);
    if (!m) continue;
    const baseNid = `P${m[1]}_${m[2]}_${m[3]}`;
    const egoPerson = examPersonByNid.get(baseNid);
    if (!egoPerson) continue;

    const name = stripParens(
      String(row[iName] || "").trim() || String(row[iFull] || "").trim(),
    );
    if (!name) continue;
    const surname = stripParens(row[iSurname]);
    const bonGwan = normalizeBonGwan(row[iClan], surname);
    const fatherPerson = personByKey.get(personKey(surname, bonGwan, name));
    if (!fatherPerson || fatherPerson === egoPerson) continue;

    addRelation(egoPerson, fatherPerson.id, "father");
    addRelation(fatherPerson.id, egoPerson, "son");
    matched++;
  }
  console.log(`${file}: ${matched} father links matched by name+clan`);
  return matched;
}

matchKinFathers("kin-mu.xlsx");
matchKinFathers("kin-sama.xlsx");

console.log(
  `kin-mun: id-linked edges (${relSkippedSelf} self/+M skipped, ${relSkippedForeign} foreign skipped)`,
);
console.log("relations by type:", JSON.stringify(relCountByType));

// ---------- 3) 출력 ----------

const clans = new Map();
for (const p of persons) {
  if (!clans.has(p.clanId)) {
    clans.set(p.clanId, {
      id: p.clanId,
      surname: p.surname,
      bonGwan: p.bonGwan,
      name: clanDisplayName(p.bonGwan, p.surname),
    });
  }
}

const out = {
  meta: {
    source:
      "한국학중앙연구원 한국역대인물종합정보시스템 (이용재 편 AKS 과거·취재 데이터)",
    note: "등급은 방목 원본에 등급 필드가 없어 연도별 nid 순번 기준으로 근사함",
    generatedAt: new Date().toISOString(),
  },
  clans: [...clans.values()],
  persons,
  exams,
  relations,
};

fs.writeFileSync(OUT, JSON.stringify(out));
const mb = (fs.statSync(OUT).size / 1024 / 1024).toFixed(1);
console.log(
  `written ${OUT} (${mb} MB): ${out.clans.length} clans, ${out.persons.length} persons, ${out.exams.length} exams, ${out.relations.length} relations`,
);