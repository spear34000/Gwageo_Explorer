import type { ClanSearchResult, ClanSummary } from "./data/types";

/**
 * 한글 본관 검색 정규화 + 매칭.
 *
 * 입력 예시:
 *   "안동 김씨" / "안동김씨" / "김해 김" / "김해김씨" / "김씨" / "김" / "안동"
 *
 * 규칙:
 *  - 공백 제거 후 끝의 "씨" 제거
 *  - 복성(남궁, 제갈, 황보, 독고, 선우, 서문, 사공, 사마, 어금 등)은 2글자 성씨로 인식
 *  - 그 외에는 마지막 글자를 성씨로 간주하고 앞부분을 본관으로 간주
 *  - 1글자 입력은 성씨 검색
 */

const COMPOUND_SURNAMES = [
  "남궁",
  "제갈",
  "황보",
  "독고",
  "선우",
  "서문",
  "사공",
  "사마",
  "어금",
  "망절",
  "강전",
  "장곡",
  "아란",
  "돈수",
  "단목",
  "무본",
  "승당",
  "도망",
  "상궁",
  "판동",
  "평현",
  "한범",
  "임문",
  "춘양",
  "홍화",
  "복동",
  "오거",
  "명봉",
  "국빈",
  "빈국",
  "묵호",
  "감천",
  "대방",
  "소봉",
  "자거",
  "사도",
  "정수",
  "동방",
  "춘추",
  "오심",
  "옥산",
  "등고",
  "낭사",
];

export interface NormalizedQuery {
  raw: string;
  /** 성씨 (없으면 undefined) */
  surname?: string;
  /** 본관 (없으면 undefined) */
  bonGwan?: string;
  /** 성씨만 검색인지 여부 */
  surnameOnly: boolean;
  /** 본관만 검색인지 여부 */
  bonGwanOnly: boolean;
}

/** 입력을 정규화한다. 빈 입력이면 모든 필드가 비어 있다 */
export function normalizeClanQuery(input: string): NormalizedQuery {
  const raw = input.trim().replace(/\s+/g, "");
  if (!raw) return { raw, surnameOnly: false, bonGwanOnly: false };

  const withoutSuffix = raw.endsWith("씨") ? raw.slice(0, -1) : raw;
  if (!withoutSuffix) return { raw, surnameOnly: false, bonGwanOnly: false };

  // 복성 확인
  for (const compound of COMPOUND_SURNAMES) {
    if (withoutSuffix.startsWith(compound)) {
      const bonGwan = withoutSuffix.slice(compound.length);
      return {
        raw,
        surname: compound,
        bonGwan: bonGwan || undefined,
        surnameOnly: !bonGwan,
        bonGwanOnly: false,
      };
    }
  }

  if (withoutSuffix.length === 1) {
    return { raw, surname: withoutSuffix, surnameOnly: true, bonGwanOnly: false };
  }

  // 마지막 글자 = 성씨, 앞부분 = 본관
  const surname = withoutSuffix.slice(-1);
  const bonGwan = withoutSuffix.slice(0, -1);
  return { raw, surname, bonGwan, surnameOnly: false, bonGwanOnly: false };
}

/** 본관 내부 이름 ("안동 김씨" 형태) 정규화 키: 공백 제거 + "씨" 제거 */
export function clanNormalizedKey(clan: { surname: string; bonGwan: string }): string {
  return `${clan.bonGwan}${clan.surname}`;
}

const MATCH_LABELS: Record<number, string> = {
  0: "정확히 일치",
  1: "본관·성씨 일치",
  2: "본관 일치",
  3: "성씨 일치",
  4: "이름 포함",
};

export function matchLabel(score: number): string {
  return MATCH_LABELS[score] ?? "관련 검색";
}

/**
 * 검색어에 대한 본관 매칭.
 * 정렬 우선순위:
 *   0. 전체 이름 정확 일치 (안동+김)
 *   1. 본관+성씨 둘 다 일치
 *   2. 본관 정확 일치
 *   3. 성씨 정확 일치
 *   4. 이름 부분 포함
 * 같은 점수 안에서는 전체 합격자 수 내림차순.
 */
export function searchClansIn(
  clans: ClanSummary[],
  query: string,
): ClanSearchResult[] {
  const q = normalizeClanQuery(query);
  if (!q.surname && !q.bonGwan) return [];

  // "본관+성씨" 결합 키. q.surname/q.bonGwan이 모두 있을 때만 의미가 있다.
  const qKey = q.surname && q.bonGwan ? `${q.bonGwan}${q.surname}` : "";

  const results: ClanSearchResult[] = [];

  for (const clan of clans) {
    const exactKey = `${clan.bonGwan}${clan.surname}`;

    // 선형 스코어 결정: 0(정확 일치) → 1(본관 포함+성씨 일치) → 2(본관 일치) → 3(성씨 일치) → 4(부분 포함) → null
    let score: number | null;
    if (q.surname && q.bonGwan && exactKey === qKey) {
      score = 0;
    } else if (q.surname && q.bonGwan && clan.surname === q.surname && clan.bonGwan.includes(q.bonGwan)) {
      // 본관·성씨 일치: 본관이 포함 관계여도 성씨가 같으면 1점 (기존 중복 조건 통합 - exact는 이미 0에서 처리)
      score = 1;
    } else if (q.bonGwan && clan.bonGwan === q.bonGwan) {
      score = 2;
    } else if (q.surname && clan.surname === q.surname) {
      score = 3;
    } else if (q.surname && q.bonGwan && exactKey.includes(qKey)) {
      // 부분 포함 (예: "안동" 입력 시 "안동 김씨"뿐 아니라 본관에 "안동"이 들어간 경우)
      score = 4;
    } else if (q.bonGwan && q.bonGwan.length >= 2 && clan.bonGwan.includes(q.bonGwan)) {
      score = 4;
    } else {
      score = null;
    }

    if (score !== null) {
      results.push({ clan, score, matchLabel: matchLabel(score) });
    }
  }

  results.sort((a, b) => {
    if (a.score !== b.score) return a.score - b.score;
    return b.clan.total - a.clan.total;
  });

  return results;
}

/** 인기 검색어 예시 (홈 화면) */
export const POPULAR_SEARCH_EXAMPLES = [
  "안동 김씨",
  "전주 이씨",
  "김해 김씨",
  "안동 권씨",
];