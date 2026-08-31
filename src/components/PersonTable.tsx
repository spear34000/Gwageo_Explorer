import type { ExamRecordRow } from "@/lib/data/types";
import { EXAM_TYPE_LABELS } from "@/lib/data/types";
import EmptyState from "./EmptyState";

interface PersonTableProps {
  rows: ExamRecordRow[];
  /** 결과 없음 메시지 (기본: "기록이 없습니다") */
  emptyMessage?: string;
}

/**
 * 합격 기록 표: 이름 / 본관 / 시험 / 합격 연도 / 왕 / 등급 / 거주지.
 * 이름은 /people/[id] 링크, 왕 셀은 "영조 12년" 형식.
 */
export default function PersonTable({ rows, emptyMessage }: PersonTableProps) {
  if (rows.length === 0) {
    return <EmptyState message={emptyMessage ?? "기록이 없습니다"} />;
  }

  return (
    <div className="table-scroll">
      <table className="data-table">
        <caption className="sr-only">합격자 기록 목록</caption>
        <thead>
          <tr>
            <th scope="col">이름</th>
            <th scope="col">본관</th>
            <th scope="col">시험</th>
            <th scope="col" className="num">
              합격 연도
            </th>
            <th scope="col">왕</th>
            <th scope="col">등급</th>
            <th scope="col">거주지</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>
                <a
                  href={`/people/${row.personId}`}
                  className="font-bold text-foreground hover:text-accent hover:underline"
                >
                  {row.personName}
                </a>
              </td>
              <td>{row.clanName}</td>
              <td>{EXAM_TYPE_LABELS[row.type]}</td>
              <td className="num">{row.year}</td>
              <td>
                {row.kingName} {row.reignYear}년
              </td>
              <td>{row.grade}</td>
              <td>{row.residence}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
