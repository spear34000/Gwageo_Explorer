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

const CHOSUNG = ["ㄱ","ㄲ","ㄴ","ㄷ","ㄸ","ㄹ","ㅁ","ㅂ","ㅃ","ㅅ","ㅆ","ㅇ","ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"] as const;

function toChosung(str: string): string {
  let out = "";
  for (const ch of str) {
    const code = ch.charCodeAt(0);
    if (code >= 0xAC00 && code <= 0xD7A3) {
      const idx = Math.floor((code - 0xAC00) / (21 * 28));
      out += CHOSUNG[idx] ?? ch;
    } else if ((ch >= "ㄱ" && ch <= "ㅎ") || (ch >= "가" && ch <= "힣")) {
      out += ch;
    }
  }
  return out;
}

function isChosungQuery(q: string): boolean {
  return /^[ㄱ-ㅎ]+$/.test(q) && q.length >= 1;
}

const HANJA_TO_HANGUL: Record<string, string> = {
  "金": "김", "李": "이", "朴": "박", "崔": "최", "鄭": "정", "趙": "조", "尹": "윤", "張": "장",
  "林": "임", "韓": "한", "吳": "오", "徐": "서", "申": "신", "權": "권", "黃": "황", "安": "안",
  "宋": "송", "全": "전", "洪": "홍", "柳": "류", "高": "고", "文": "문", "梁": "양", "孫": "손",
  "裵": "배", "白": "백", "許": "허", "南": "남", "沈": "심", "盧": "노", "河": "하", "郭": "곽",
  "成": "성", "車": "차", "朱": "주", "禹": "우", "具": "구", "閔": "민", "劉": "유", "陳": "진",
  "池": "지", "嚴": "엄", "蔡": "채", "元": "원", "千": "천", "方": "방", "孔": "공", "姜": "강",
  "海": "해", "慶": "경", "州": "주", "東": "동", "密": "밀", "陽": "양", "達": "달", "城": "성",
  "平": "평", "原": "원", "瑞": "서", "山": "산", "光": "광", "豐": "풍", "興": "흥",
};

function containsHanja(q: string): boolean {
  return /[\u4E00-\u9FFF]/.test(q);
}

function hanjaToHangul(q: string): string {
  let out = "";
  for (const ch of q) {
    out += HANJA_TO_HANGUL[ch] ?? ch;
  }
  return out;
}

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}

const MATCH_LABELS: Record<number, string> = {
  0: "정확히 일치",
  1: "본관·성씨 일치",
  2: "본관 일치",
  3: "성씨 일치",
  4: "이름 포함",
  5: "초성 일치",
  6: "한자 일치",
  7: "유사 검색",
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
  const rawQuery = query.trim();
  if (!rawQuery) return [];

  // 한자 포함 시 한자→한글 변환 후 재검색 (예: "金海" -> "김해")
  if (containsHanja(rawQuery)) {
    const converted = hanjaToHangul(rawQuery);
    if (converted !== rawQuery) {
      const hanjaResults = searchClansIn(clans, converted);
      if (hanjaResults.length > 0) {
        return hanjaResults.map((r) => ({ ...r, score: 6, matchLabel: matchLabel(6) }));
      }
    }
  }

  // 초성 검색 (예: "ㄱㅎ" -> "김해", "ㅇㄷㄱㅅ" -> "안동김씨")
  if (isChosungQuery(rawQuery.replace(/\s+/g, ""))) {
    const qCho = rawQuery.replace(/\s+/g, "");
    const results: ClanSearchResult[] = [];
    for (const clan of clans) {
      const clanCho = toChosung(`${clan.bonGwan}${clan.surname}`);
      const nameCho = toChosung(clan.name.replace(/\s+/g, "").replace(/씨$/, ""));
      if (clanCho.includes(qCho) || nameCho.includes(qCho)) {
        results.push({ clan, score: 5, matchLabel: matchLabel(5) });
      }
    }
    if (results.length > 0) {
      results.sort((a, b) => {
        if (a.score !== b.score) return a.score - b.score;
        return b.clan.total - a.clan.total;
      });
      return results;
    }
  }

  const q = normalizeClanQuery(rawQuery);
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

  if (results.length > 0) {
    results.sort((a, b) => {
      if (a.score !== b.score) return a.score - b.score;
      return b.clan.total - a.clan.total;
    });
    return results;
  }

  // 유사 검색 (오타 교정): Levenshtein 1 이내
  if (rawQuery.replace(/\s+/g, "").length >= 2) {
    const qNorm = rawQuery.replace(/\s+/g, "").replace(/씨$/, "");
    const typoResults: ClanSearchResult[] = [];
    for (const clan of clans) {
      const clanKey = `${clan.bonGwan}${clan.surname}`;
      const clanNameNorm = clan.name.replace(/\s+/g, "").replace(/씨$/, "");
      if (levenshtein(qNorm, clanKey) === 1 || levenshtein(qNorm, clanNameNorm) === 1) {
        typoResults.push({ clan, score: 7, matchLabel: matchLabel(7) });
      }
    }
    if (typoResults.length > 0) {
      typoResults.sort((a, b) => {
        if (a.score !== b.score) return a.score - b.score;
        return b.clan.total - a.clan.total;
      });
      return typoResults;
    }
  }

  return results;
}

/** 인기 검색어 예시 (홈 화면) */
export const POPULAR_SEARCH_EXAMPLES = [
  "안동 김씨",
  "전주 이씨",
  "김해 김씨",
  "안동 권씨",
];