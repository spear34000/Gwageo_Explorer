import type { ClanSummary, ExamColumn } from "@/lib/data/types";
import { EXAM_COLUMN_LABELS } from "@/lib/data/types";
import { formatNumber, formatRank } from "@/lib/format";

interface RankingTableProps {
  clans: ClanSummary[];
  /** 현재 정렬 기준 컬럼 (강조 + 링크 유지) */
  sortBy: ExamColumn;
  /** 순위 컬럼 표시 여부 (기본 true) */
  showRank?: boolean;
}

/** 정렬 가능한 숫자 컬럼 (전체/문과/무과/생원/진사) */
const NUMERIC_COLUMNS: ExamColumn[] = ["total", "mun", "mu", "saengwon", "jinsa"];

/**
 * 본관별 합격자 순위표.
 * 헤더 셀은 /rankings?sort=... 링크(정렬), 현재 정렬 컬럼은 강조한다.
 * 본관명 셀은 /clans/[id] 링크. 순위 1위는 accent + bold로 강조.
 */
export default function RankingTable({
  clans,
  sortBy,
  showRank = true,
}: RankingTableProps) {
  return (
    <div className="table-scroll">
      <table className="data-table">
        <caption className="sr-only">본관별 합격자 순위</caption>
        <thead>
          <tr>
            {showRank && (
              <th scope="col" className="num">
                순위
              </th>
            )}
            <th scope="col">본관</th>
            {NUMERIC_COLUMNS.map((col) => {
              const active = col === sortBy;
              return (
                <th key={col} scope="col" className="num">
                  <a
                    href={`/rankings?sort=${col}`}
                    className={
                      active
                        ? "font-semibold text-accent underline underline-offset-2"
                        : "hover:underline"
                    }
                  >
                    {EXAM_COLUMN_LABELS[col]}
                  </a>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {clans.map((clan) => (
            <tr key={clan.id}>
              {showRank && (
                <td
                  className={`num ${
                    clan.rank === 1 ? "font-bold text-accent" : ""
                  }`}
                >
                  {formatRank(clan.rank)}
                </td>
              )}
              <td>
                <a
                  href={`/clans/${clan.id}`}
                  className="font-medium text-foreground hover:text-accent hover:underline"
                >
                  {clan.name}
                </a>
              </td>
              {NUMERIC_COLUMNS.map((col) => (
                <td key={col} className="num">
                  {formatNumber(clan[col])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
