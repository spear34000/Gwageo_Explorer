import type { ClanSeed, ExamType, PersonSeed } from "./types";

/**
 * 본관 로스터 (데모 데이터의 골격)
 *
 * 목표 총합격자 수 범위는 weight로 조절된다.
 *   대형: 110-140 / 중대형: 60-90 / 중형: 25-50 / 중소형: 10-20
 *
 * 시험 유형 프로필 (examProfile): 본관별 문과/무과/생원/진사 비중.
 *  - scholar: 문과·생원·진사 위주 (사대부 가문)
 *  - balanced: 고르게 분포
 *  - military: 무과 비중이 높은 본관
 *  - literati: 생원·진사(소과) 비중이 높은 본관
 */

export type ExamProfile = "scholar" | "balanced" | "military" | "literati";

export interface ClanRosterEntry extends ClanSeed {
  examProfile: ExamProfile;
  /** targetTotalWeight: 대략적인 총 합격 기록 수 (생성 시 이 근처로 보정) */
  targetTotal: number;
}

export const CLAN_ROSTER: ClanRosterEntry[] = [
  // ── 대형 (110-140) ─────────────────────────────
  { id: "andong-kim", surname: "김", bonGwan: "안동", name: "안동 김씨", mainResidence: "한성", weight: 130, examProfile: "scholar", targetTotal: 130 },
  { id: "gimhae-kim", surname: "김", bonGwan: "김해", name: "김해 김씨", mainResidence: "김해", weight: 140, examProfile: "military", targetTotal: 140 },
  { id: "gyeongju-kim", surname: "김", bonGwan: "경주", name: "경주 김씨", mainResidence: "경주", weight: 125, examProfile: "military", targetTotal: 125 },
  { id: "jeonju-yi", surname: "이", bonGwan: "전주", name: "전주 이씨", mainResidence: "한성", weight: 135, examProfile: "balanced", targetTotal: 135 },
  { id: "miryang-bak", surname: "박", bonGwan: "밀양", name: "밀양 박씨", mainResidence: "밀양", weight: 120, examProfile: "balanced", targetTotal: 120 },

  // ── 중대형 (60-90) ─────────────────────────────
  { id: "gwangju-kim", surname: "김", bonGwan: "광산", name: "광산 김씨", mainResidence: "한성", weight: 85, examProfile: "scholar", targetTotal: 85 },
  { id: "bannam-bak", surname: "박", bonGwan: "반남", name: "반남 박씨", mainResidence: "한성", weight: 75, examProfile: "scholar", targetTotal: 75 },
  { id: "gyeongju-yi", surname: "이", bonGwan: "경주", name: "경주 이씨", mainResidence: "경주", weight: 80, examProfile: "scholar", targetTotal: 80 },
  { id: "papyeong-yun", surname: "윤", bonGwan: "파평", name: "파평 윤씨", mainResidence: "한성", weight: 78, examProfile: "scholar", targetTotal: 78 },
  { id: "yeoheung-min", surname: "민", bonGwan: "여흥", name: "여흥 민씨", mainResidence: "한성", weight: 72, examProfile: "scholar", targetTotal: 72 },
  { id: "cheongju-han", surname: "한", bonGwan: "청주", name: "청주 한씨", mainResidence: "한성", weight: 70, examProfile: "balanced", targetTotal: 70 },
  { id: "munhwa-ryu", surname: "류", bonGwan: "문화", name: "문화 류씨", mainResidence: "한성", weight: 68, examProfile: "scholar", targetTotal: 68 },
  { id: "andong-gwon", surname: "권", bonGwan: "안동", name: "안동 권씨", mainResidence: "안동", weight: 66, examProfile: "balanced", targetTotal: 66 },

  // ── 중형 (25-50) ───────────────────────────────
  { id: "seonsan-kim", surname: "김", bonGwan: "선산", name: "선산 김씨", mainResidence: "선산", weight: 45, examProfile: "balanced", targetTotal: 45 },
  { id: "deoksu-yi", surname: "이", bonGwan: "덕수", name: "덕수 이씨", mainResidence: "한성", weight: 42, examProfile: "balanced", targetTotal: 42 },
  { id: "yeonan-yi", surname: "이", bonGwan: "연안", name: "연안 이씨", mainResidence: "한성", weight: 40, examProfile: "scholar", targetTotal: 40 },
  { id: "hansan-yi", surname: "이", bonGwan: "한산", name: "한산 이씨", mainResidence: "한성", weight: 38, examProfile: "scholar", targetTotal: 38 },
  { id: "goseong-yi", surname: "이", bonGwan: "고성", name: "고성 이씨", mainResidence: "한성", weight: 30, examProfile: "scholar", targetTotal: 30 },
  { id: "jeonju-choe", surname: "최", bonGwan: "전주", name: "전주 최씨", mainResidence: "한성", weight: 44, examProfile: "balanced", targetTotal: 44 },
  { id: "onyang-jeong", surname: "정", bonGwan: "온양", name: "온양 정씨", mainResidence: "한성", weight: 40, examProfile: "scholar", targetTotal: 40 },
  { id: "dongnae-jeong", surname: "정", bonGwan: "동래", name: "동래 정씨", mainResidence: "동래", weight: 32, examProfile: "balanced", targetTotal: 32 },
  { id: "jinju-gang", surname: "강", bonGwan: "진주", name: "진주 강씨", mainResidence: "진주", weight: 46, examProfile: "balanced", targetTotal: 46 },
  { id: "geumcheon-gang", surname: "강", bonGwan: "금천", name: "금천 강씨", mainResidence: "한성", weight: 26, examProfile: "scholar", targetTotal: 26 },
  { id: "hanyang-jo", surname: "조", bonGwan: "한양", name: "한양 조씨", mainResidence: "한성", weight: 36, examProfile: "scholar", targetTotal: 36 },
  { id: "pungyang-jo", surname: "조", bonGwan: "풍양", name: "풍양 조씨", mainResidence: "한성", weight: 38, examProfile: "scholar", targetTotal: 38 },
  { id: "changnyeong-jo", surname: "조", bonGwan: "창녕", name: "창녕 조씨", mainResidence: "창녕", weight: 35, examProfile: "balanced", targetTotal: 35 },
  { id: "haenam-yun", surname: "윤", bonGwan: "해남", name: "해남 윤씨", mainResidence: "해남", weight: 28, examProfile: "literati", targetTotal: 28 },
  { id: "chirwon-yun", surname: "윤", bonGwan: "칠원", name: "칠원 윤씨", mainResidence: "칠원", weight: 25, examProfile: "balanced", targetTotal: 25 },
  { id: "pungsan-ryu", surname: "류", bonGwan: "풍산", name: "풍산 류씨", mainResidence: "한성", weight: 34, examProfile: "scholar", targetTotal: 34 },
  { id: "eunjin-song", surname: "송", bonGwan: "은진", name: "은진 송씨", mainResidence: "한성", weight: 33, examProfile: "scholar", targetTotal: 33 },
  { id: "haeju-oh", surname: "오", bonGwan: "해주", name: "해주 오씨", mainResidence: "한성", weight: 31, examProfile: "scholar", targetTotal: 31 },
  { id: "pyeongsan-shin", surname: "신", bonGwan: "평산", name: "평산 신씨", mainResidence: "한성", weight: 36, examProfile: "balanced", targetTotal: 36 },
  { id: "sunheung-an", surname: "안", bonGwan: "순흥", name: "순흥 안씨", mainResidence: "순흥", weight: 30, examProfile: "balanced", targetTotal: 30 },
  { id: "cheongsong-shim", surname: "심", bonGwan: "청송", name: "청송 심씨", mainResidence: "한성", weight: 29, examProfile: "scholar", targetTotal: 29 },
  { id: "daegu-seo", surname: "서", bonGwan: "대구", name: "대구 서씨", mainResidence: "한성", weight: 27, examProfile: "scholar", targetTotal: 27 },
  { id: "changnyeong-seong", surname: "성", bonGwan: "창녕", name: "창녕 성씨", mainResidence: "창녕", weight: 30, examProfile: "balanced", targetTotal: 30 },

  // ── 중소형 (10-20) ─────────────────────────────
  { id: "yeosan-song", surname: "송", bonGwan: "여산", name: "여산 송씨", mainResidence: "한성", weight: 18, examProfile: "scholar", targetTotal: 18 },
  { id: "jinju-ha", surname: "하", bonGwan: "진주", name: "진주 하씨", mainResidence: "진주", weight: 20, examProfile: "balanced", targetTotal: 20 },
  { id: "neungseong-gu", surname: "구", bonGwan: "능성", name: "능성 구씨", mainResidence: "능성", weight: 15, examProfile: "balanced", targetTotal: 15 },
  { id: "gyeongju-choe", surname: "최", bonGwan: "경주", name: "경주 최씨", mainResidence: "경주", weight: 17, examProfile: "military", targetTotal: 17 },
];

/**
 * 실존 인물 시드.
 * 본관-인물 대응은 역사적으로 확실한 것만 포함한다.
 * 합격 연도·등급·거주지는 개발용 샘플 값이며, 실제 데이터 연동 시 교체된다.
 * (데모 데이터임을 UI 배너와 isDemoData 플래그로 명시)
 */
export interface RealPersonSeed extends PersonSeed {
  exam: { type: ExamType; year: number; kingId: string; grade: string };
}

export const REAL_PEOPLE: RealPersonSeed[] = [
  // 안동 김씨
  { id: "p-kim-sangheon", name: "김상헌", surname: "김", bonGwan: "안동", clanId: "andong-kim", residence: "한성", birthYear: 1570, deathYear: 1652, exam: { type: "mun", year: 1590, kingId: "seonjo", grade: "을과" } },
  { id: "p-kim-suhaeng", name: "김수항", surname: "김", bonGwan: "안동", clanId: "andong-kim", residence: "한성", birthYear: 1629, deathYear: 1689, exam: { type: "mun", year: 1651, kingId: "hyojong", grade: "갑과" } },
  { id: "p-kim-changjip", name: "김창집", surname: "김", bonGwan: "안동", clanId: "andong-kim", residence: "한성", birthYear: 1648, deathYear: 1722, exam: { type: "mun", year: 1675, kingId: "sukjong", grade: "을과" } },
  { id: "p-kim-josun", name: "김조순", surname: "김", bonGwan: "안동", clanId: "andong-kim", residence: "한성", birthYear: 1765, deathYear: 1832, exam: { type: "mun", year: 1786, kingId: "jeongjo", grade: "갑과" } },
  // 안동 권씨
  { id: "p-gwon-yul", name: "권율", surname: "권", bonGwan: "안동", clanId: "andong-gwon", residence: "한성", birthYear: 1537, deathYear: 1599, exam: { type: "mu", year: 1582, kingId: "seonjo", grade: "을과" } },
  { id: "p-gwon-sangha", name: "권상하", surname: "권", bonGwan: "안동", clanId: "andong-gwon", residence: "한성", birthYear: 1641, deathYear: 1721, exam: { type: "mun", year: 1668, kingId: "hyeonjong", grade: "을과" } },
  // 전주 이씨
  { id: "p-yi-hangbok", name: "이항복", surname: "이", bonGwan: "전주", clanId: "jeonju-yi", residence: "한성", birthYear: 1556, deathYear: 1618, exam: { type: "mun", year: 1580, kingId: "seonjo", grade: "갑과" } },
  // 경주 김씨
  { id: "p-kim-ilsun", name: "김일손", surname: "김", bonGwan: "경주", clanId: "gyeongju-kim", residence: "경주", birthYear: 1464, deathYear: 1498, exam: { type: "mun", year: 1489, kingId: "seongjong", grade: "을과" } },
  // 광산 김씨
  { id: "p-kim-inhu", name: "김인후", surname: "김", bonGwan: "광산", clanId: "gwangju-kim", residence: "장성", birthYear: 1510, deathYear: 1560, exam: { type: "mun", year: 1540, kingId: "jungjong", grade: "을과" } },
  { id: "p-kim-jangsaeng", name: "김장생", surname: "김", bonGwan: "광산", clanId: "gwangju-kim", residence: "한성", birthYear: 1548, deathYear: 1631, exam: { type: "saengwon", year: 1570, kingId: "seonjo", grade: "1등" } },
  // 덕수 이씨
  { id: "p-yi-yi", name: "이이", surname: "이", bonGwan: "덕수", clanId: "deoksu-yi", residence: "한성", birthYear: 1536, deathYear: 1584, exam: { type: "mun", year: 1564, kingId: "myeongjong", grade: "갑과" } },
  { id: "p-yi-sunsin", name: "이순신", surname: "이", bonGwan: "덕수", clanId: "deoksu-yi", residence: "한성", birthYear: 1545, deathYear: 1598, exam: { type: "mu", year: 1576, kingId: "seonjo", grade: "을과" } },
  // 여흥 민씨
  { id: "p-min-jinwon", name: "민진원", surname: "민", bonGwan: "여흥", clanId: "yeoheung-min", residence: "한성", birthYear: 1664, deathYear: 1736, exam: { type: "mun", year: 1696, kingId: "sukjong", grade: "갑과" } },
  // 은진 송씨
  { id: "p-song-siyeol", name: "송시열", surname: "송", bonGwan: "은진", clanId: "eunjin-song", residence: "한성", birthYear: 1607, deathYear: 1689, exam: { type: "saengwon", year: 1633, kingId: "injo", grade: "1등" } },
  { id: "p-song-jungil", name: "송준길", surname: "송", bonGwan: "은진", clanId: "eunjin-song", residence: "한성", birthYear: 1606, deathYear: 1672, exam: { type: "saengwon", year: 1633, kingId: "injo", grade: "1등" } },
  // 반남 박씨
  { id: "p-bak-sedang", name: "박세당", surname: "박", bonGwan: "반남", clanId: "bannam-bak", residence: "한성", birthYear: 1629, deathYear: 1703, exam: { type: "mun", year: 1660, kingId: "hyeonjong", grade: "을과" } },
  { id: "p-bak-jiwon", name: "박지원", surname: "박", bonGwan: "반남", clanId: "bannam-bak", residence: "한성", birthYear: 1737, deathYear: 1805, exam: { type: "jinsa", year: 1765, kingId: "yeongjo", grade: "1등" } },
  // 문화 류씨
  { id: "p-ryu-seongryong", name: "류성룡", surname: "류", bonGwan: "문화", clanId: "munhwa-ryu", residence: "한성", birthYear: 1542, deathYear: 1607, exam: { type: "mun", year: 1566, kingId: "myeongjong", grade: "을과" } },
  // 청주 한씨
  { id: "p-han-myeonghoe", name: "한명회", surname: "한", bonGwan: "청주", clanId: "cheongju-han", residence: "한성", birthYear: 1415, deathYear: 1487, exam: { type: "mun", year: 1441, kingId: "sejong", grade: "을과" } },
  { id: "p-han-ho", name: "한호", surname: "한", bonGwan: "청주", clanId: "cheongju-han", residence: "한성", birthYear: 1543, deathYear: 1605, exam: { type: "saengwon", year: 1587, kingId: "seonjo", grade: "2등" } },
  // 한양 조씨
  { id: "p-jo-gwangjo", name: "조광조", surname: "조", bonGwan: "한양", clanId: "hanyang-jo", residence: "한성", birthYear: 1482, deathYear: 1519, exam: { type: "mun", year: 1510, kingId: "jungjong", grade: "을과" } },
  // 진주 강씨
  { id: "p-gang-huimaeng", name: "강희맹", surname: "강", bonGwan: "진주", clanId: "jinju-gang", residence: "한성", birthYear: 1424, deathYear: 1483, exam: { type: "mun", year: 1447, kingId: "sejong", grade: "을과" } },
  // 대구 서씨
  { id: "p-seo-geojeong", name: "서거정", surname: "서", bonGwan: "대구", clanId: "daegu-seo", residence: "한성", birthYear: 1420, deathYear: 1488, exam: { type: "mun", year: 1453, kingId: "danjong", grade: "을과" } },
  // 온양 정씨
  { id: "p-jeong-inji", name: "정인지", surname: "정", bonGwan: "온양", clanId: "onyang-jeong", residence: "한성", birthYear: 1396, deathYear: 1478, exam: { type: "mun", year: 1423, kingId: "sejong", grade: "을과" } },
  // 평산 신씨
  { id: "p-shin-sukju", name: "신숙주", surname: "신", bonGwan: "평산", clanId: "pyeongsan-shin", residence: "한성", birthYear: 1417, deathYear: 1475, exam: { type: "mun", year: 1441, kingId: "sejong", grade: "을과" } },
  // 창녕 조씨
  { id: "p-jo-sik", name: "조식", surname: "조", bonGwan: "창녕", clanId: "changnyeong-jo", residence: "창녕", birthYear: 1501, deathYear: 1572, exam: { type: "saengwon", year: 1528, kingId: "jungjong", grade: "1등" } },
  // 풍양 조씨
  { id: "p-jo-inyeong", name: "조인영", surname: "조", bonGwan: "풍양", clanId: "pungyang-jo", residence: "한성", birthYear: 1782, deathYear: 1850, exam: { type: "mun", year: 1807, kingId: "sunjo", grade: "을과" } },
  // 전주 최씨
  { id: "p-choe-myeonggil", name: "최명길", surname: "최", bonGwan: "전주", clanId: "jeonju-choe", residence: "한성", birthYear: 1586, deathYear: 1647, exam: { type: "mun", year: 1605, kingId: "seonjo", grade: "을과" } },
  // 청송 심씨
  { id: "p-shim-jiwon", name: "심지원", surname: "심", bonGwan: "청송", clanId: "cheongsong-shim", residence: "한성", birthYear: 1593, deathYear: 1662, exam: { type: "mun", year: 1630, kingId: "injo", grade: "을과" } },
  // 해남 윤씨
  { id: "p-yun-seondo", name: "윤선도", surname: "윤", bonGwan: "해남", clanId: "haenam-yun", residence: "해남", birthYear: 1587, deathYear: 1671, exam: { type: "jinsa", year: 1628, kingId: "injo", grade: "1등" } },
];