import type { King } from "./types";

/**
 * 조선 왕조 27대 왕 재위 연도.
 * 태조~고종, 연산군/광해군/경종/헌종/철종 포함.
 * 과거(문과)는 갑오개혁(1894)으로 폐지되므로 고종의 마지막 연도는 1894로 둔다.
 */
export const KINGS: King[] = [
  { id: "taejo", name: "태조", reignStart: 1392, reignEnd: 1398 },
  { id: "jeongjong", name: "정종", reignStart: 1398, reignEnd: 1400 },
  { id: "taejong", name: "태종", reignStart: 1400, reignEnd: 1418 },
  { id: "sejong", name: "세종", reignStart: 1418, reignEnd: 1450 },
  { id: "munjong", name: "문종", reignStart: 1450, reignEnd: 1452 },
  { id: "danjong", name: "단종", reignStart: 1452, reignEnd: 1455 },
  { id: "sejo", name: "세조", reignStart: 1455, reignEnd: 1468 },
  { id: "yejong", name: "예종", reignStart: 1468, reignEnd: 1469 },
  { id: "seongjong", name: "성종", reignStart: 1469, reignEnd: 1494 },
  { id: "yeonsangun", name: "연산군", reignStart: 1494, reignEnd: 1506 },
  { id: "jungjong", name: "중종", reignStart: 1506, reignEnd: 1544 },
  { id: "injong", name: "인종", reignStart: 1544, reignEnd: 1545 },
  { id: "myeongjong", name: "명종", reignStart: 1545, reignEnd: 1567 },
  { id: "seonjo", name: "선조", reignStart: 1567, reignEnd: 1608 },
  { id: "gwanghaegun", name: "광해군", reignStart: 1608, reignEnd: 1623 },
  { id: "injo", name: "인조", reignStart: 1623, reignEnd: 1649 },
  { id: "hyojong", name: "효종", reignStart: 1649, reignEnd: 1659 },
  { id: "hyeonjong", name: "현종", reignStart: 1659, reignEnd: 1674 },
  { id: "sukjong", name: "숙종", reignStart: 1674, reignEnd: 1720 },
  { id: "gyeongjong", name: "경종", reignStart: 1720, reignEnd: 1724 },
  { id: "yeongjo", name: "영조", reignStart: 1724, reignEnd: 1776 },
  { id: "jeongjo", name: "정조", reignStart: 1776, reignEnd: 1800 },
  { id: "sunjo", name: "순조", reignStart: 1800, reignEnd: 1834 },
  { id: "heonjong", name: "헌종", reignStart: 1834, reignEnd: 1849 },
  { id: "cheoljong", name: "철종", reignStart: 1849, reignEnd: 1863 },
  { id: "gojong", name: "고종", reignStart: 1863, reignEnd: 1894 },
];

const KING_BY_ID = new Map(KINGS.map((k) => [k.id, k]));

export function getKing(id: string): King | undefined {
  return KING_BY_ID.get(id);
}

export function getKingName(id: string): string {
  return KING_BY_ID.get(id)?.name ?? id;
}

/** 재위 연수 (1부터) */
export function reignYear(kingId: string, year: number): number {
  const king = KING_BY_ID.get(kingId);
  if (!king) return 0;
  return year - king.reignStart + 1;
}

/** "영조 12년" 형식 라벨 */
export function kingYearLabel(kingId: string, year: number): string {
  const king = KING_BY_ID.get(kingId);
  if (!king) return `${year}년`;
  const ry = year - king.reignStart + 1;
  return `${king.name} ${ry}년`;
}