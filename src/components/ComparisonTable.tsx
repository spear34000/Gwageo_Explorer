import type { ClanComparison } from "@/lib/data/types";
import { formatNumber } from "@/lib/format";

interface ComparisonTableProps {
  comparison: ClanComparison;
}

type Winner = "a" | "b" | null;

function winnerOf(a: number, b: number): Winner {
  if (a > b) return "a";
  if (b > a) return "b";
  return null;
}

/**
 * 본관 비교 표 (항목 / A / B).
 * 수치 항목은 formatNumber로 표시하고, 더 큰 쪽을 accent + bold로 강조한다.
 * 열 헤더는 본관명 링크(/clans/[id]).
 */
export default function ComparisonTable({ comparison }: ComparisonTableProps) {
  const { a, b } = comparison;

  const numericRows: { label: string; a: number; b: number }[] = [
    { label: "전체 합격자", a: a.total, b: b.total },
    { label: "문과", a: a.mun, b: b.mun },
    { label: "무과", a: a.mu, b: b.mu },
    { label: "생원", a: a.saengwon, b: b.saengwon },
    { label: "진사", a: a.jinsa, b: b.jinsa },
  ];

  return (
    <div className="table-scroll">
      <table className="data-table">
        <caption className="sr-only">
          본관 비교: {a.name} 대 {b.name}
        </caption>
        <thead>
          <tr>
            <th scope="col">
              <span className="sr-only">항목</span>
            </th>
            <th scope="col">
              <a href={`/clans/${a.id}`}>{a.name}</a>
            </th>
            <th scope="col">
              <a href={`/clans/${b.id}`}>{b.name}</a>
            </th>
          </tr>
        </thead>
        <tbody>
          {numericRows.map((row) => {
            const win = winnerOf(row.a, row.b);
            const aClass = win === "a" ? "num font-bold text-accent" : "num";
            const bClass = win === "b" ? "num font-bold text-accent" : "num";
            return (
              <tr key={row.label}>
                <th scope="row" className="font-medium text-foreground">
                  {row.label}
                </th>
                <td className={aClass}>{formatNumber(row.a)}</td>
                <td className={bClass}>{formatNumber(row.b)}</td>
              </tr>
            );
          })}
          <tr>
            <th scope="row" className="font-medium text-foreground">
              전성기 왕
            </th>
            <td>{comparison.peakKings.a}</td>
            <td>{comparison.peakKings.b}</td>
          </tr>
          <tr>
            <th scope="row" className="font-medium text-foreground">
              주요 거주지
            </th>
            <td>{comparison.mainResidences.a}</td>
            <td>{comparison.mainResidences.b}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
