/** 숫자 천 단위 콤마 ("428" -> "428", "1234" -> "1,234") */
export function formatNumber(n: number): string {
  return n.toLocaleString("ko-KR");
}

/** "12위" 형식 순위 라벨 */
export function formatRank(rank: number): string {
  return `${rank}위`;
}

/** 퍼센트 ("34.2%") */
export function formatPercent(ratio: number, digits = 1): string {
  return `${(ratio * 100).toFixed(digits)}%`;
}