import type { ExamSeed, ExamType, PersonSeed, RelationSeed } from "./types";
import { CLAN_ROSTER, REAL_PEOPLE } from "./clan-roster";
import type { ExamProfile } from "./clan-roster";
import { KINGS } from "./kings";

/**
 * 개발용 mock 데이터셋.
 *
 * PERSON_SEEDS / EXAM_SEEDS / RELATION_SEEDS 는
 * MockDataRepository(또는 DB 전환 후 ingestion)가 소비하는 원본 시드다.
 *
 * 실존 인물(REAL_PEOPLE)은 본관-인물 대응만 역사적으로 확실한 값을 쓰고,
 * 그 외의 인물/합격 기록은 시드 고정 PRNG로 생성한 개발용 샘플이다.
 * 샘플임을 UI 배너와 isDemoData 플래그로 명시한다.
 */

/** 시드 고정 난수 생성기 (mulberry32). 실행마다 동일한 데이터를 만든다 */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rnd = mulberry32(20260818);

/** 시험 유형 분포 (본관 프로필별). 확률 합은 1 */
const EXAM_TYPE_DIST: Record<ExamProfile, [ExamType, number][]> = {
  scholar: [
    ["mun", 0.55],
    ["saengwon", 0.25],
    ["jinsa", 0.15],
    ["mu", 0.05],
  ],
  balanced: [
    ["mun", 0.35],
    ["mu", 0.2],
    ["saengwon", 0.25],
    ["jinsa", 0.2],
  ],
  military: [
    ["mu", 0.6],
    ["mun", 0.15],
    ["saengwon", 0.15],
    ["jinsa", 0.1],
  ],
  literati: [
    ["saengwon", 0.4],
    ["jinsa", 0.35],
    ["mun", 0.2],
    ["mu", 0.05],
  ],
};

function pickExamType(profile: ExamProfile): ExamType {
  const dist = EXAM_TYPE_DIST[profile];
  const r = rnd();
  let acc = 0;
  for (const [type, weight] of dist) {
    acc += weight;
    if (r < acc) return type;
  }
  return dist[dist.length - 1][0];
}

/** 재위 연수가 길고 과거 활황기일수록 기록이 많이 쌓이도록 가중치를 준다 */
const KING_ERA_FACTOR: Record<string, number> = {
  taejo: 0.6, jeongjong: 0.5, taejong: 0.9, sejong: 1.1,
  munjong: 0.6, danjong: 0.5, sejo: 0.9, yejong: 0.5,
  seongjong: 1.1, yeonsangun: 0.8, jungjong: 1.2, injong: 0.6,
  myeongjong: 1.1, seonjo: 1.4, gwanghaegun: 0.9, injo: 1.3,
  hyojong: 1.0, hyeonjong: 1.0, sukjong: 1.4, gyeongjong: 0.6,
  yeongjo: 1.5, jeongjo: 1.4, sunjo: 1.2, heonjong: 0.8,
  cheoljong: 0.7, gojong: 0.7,
};

interface WeightedKing {
  id: string;
  start: number;
  end: number;
  weight: number;
}

const WEIGHTED_KINGS: WeightedKing[] = KINGS.map((k) => {
  const factor = KING_ERA_FACTOR[k.id] ?? 1;
  return {
    id: k.id,
    start: k.reignStart,
    end: k.reignEnd,
    weight: (k.reignEnd - k.reignStart + 1) * factor,
  };
});

const TOTAL_WEIGHT = WEIGHTED_KINGS.reduce((s, k) => s + k.weight, 0);

function pickYear(): { kingId: string; year: number } {
  const r = rnd() * TOTAL_WEIGHT;
  let acc = 0;
  for (const k of WEIGHTED_KINGS) {
    acc += k.weight;
    if (r < acc) {
      return {
        kingId: k.id,
        year: k.start + Math.floor(rnd() * (k.end - k.start + 1)),
      };
    }
  }
  const last = WEIGHTED_KINGS[WEIGHTED_KINGS.length - 1];
  return { kingId: last.id, year: last.end };
}

function pickGrade(type: ExamType): string {
  const r = rnd();
  if (type === "mun" || type === "mu") {
    if (r < 0.08) return "갑과";
    if (r < 0.4) return "을과";
    return "병과";
  }
  if (r < 0.12) return "1등";
  if (r < 0.42) return "2등";
  return "3등";
}

const GIVEN_POOL = Array.from(
  new Set([
    "진","석","준","호","원","식","규","익","정","명","필","윤","하","중",
    "양","회","영","세","광","만","도","숙","백","병","재","홍","경","서",
    "우","천","택","종","달","환","형","봉","선","극","남","상","신","림",
    "기","대","제","연","시","창","건","덕","현","길","직","완","학","수",
    "면","각","승","계","유","일","탁","효","인","복","이","증","옥","묵",
    "간","성","오","취","당","윤","조","구","평","온","겸","사","훈","개",
  ]),
);

const personSeeds: PersonSeed[] = [];
const examSeeds: ExamSeed[] = [];

const realByClan = new Map<string, typeof REAL_PEOPLE>();
for (const rp of REAL_PEOPLE) {
  personSeeds.push({
    id: rp.id,
    name: rp.name,
    surname: rp.surname,
    bonGwan: rp.bonGwan,
    clanId: rp.clanId,
    residence: rp.residence,
    birthYear: rp.birthYear,
    deathYear: rp.deathYear,
  });
  examSeeds.push({
    id: `e-${rp.id}`,
    personId: rp.id,
    type: rp.exam.type,
    year: rp.exam.year,
    kingId: rp.exam.kingId,
    grade: rp.exam.grade,
  });
  const list = realByClan.get(rp.clanId) ?? [];
  list.push(rp);
  realByClan.set(rp.clanId, list);
}

for (const clan of CLAN_ROSTER) {
  const realCount = realByClan.get(clan.id)?.length ?? 0;
  const syntheticCount = Math.max(clan.targetTotal - realCount, 0);

  for (let i = 0; i < syntheticCount; i++) {
    const { kingId, year } = pickYear();
    const type = pickExamType(clan.examProfile);
    const given = GIVEN_POOL[Math.floor(rnd() * GIVEN_POOL.length)];
    const residence =
      rnd() < 0.75 ? clan.mainResidence : "한성";
    const birthYear = year - (25 + Math.floor(rnd() * 20));
    let deathYear = birthYear + (50 + Math.floor(rnd() * 30));
    if (deathYear < year) deathYear = year + (10 + Math.floor(rnd() * 35));

    const id = `p-${clan.id}-${i + 1}`;
    personSeeds.push({
      id,
      name: clan.surname + given,
      surname: clan.surname,
      bonGwan: clan.bonGwan,
      clanId: clan.id,
      residence,
      birthYear,
      deathYear,
    });
    examSeeds.push({
      id: `e-${clan.id}-${i + 1}`,
      personId: id,
      type,
      year,
      kingId,
      grade: pickGrade(type),
    });
  }
}

/**
 * 실존 기록에 근거한 관계만 포함한다.
 * (김상헌-김수항 조손, 김수항-김창집 부자)
 */
export const RELATION_SEEDS: RelationSeed[] = [
  { personId: "p-kim-sangheon", relatedPersonId: "p-kim-suhaeng", type: "grandfather" },
  { personId: "p-kim-suhaeng", relatedPersonId: "p-kim-sangheon", type: "grandson" },
  { personId: "p-kim-suhaeng", relatedPersonId: "p-kim-changjip", type: "father" },
  { personId: "p-kim-changjip", relatedPersonId: "p-kim-suhaeng", type: "son" },
];

export const PERSON_SEEDS: PersonSeed[] = personSeeds;
export const EXAM_SEEDS: ExamSeed[] = examSeeds;
