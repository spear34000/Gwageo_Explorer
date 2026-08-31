import type { ClanDetail } from "@/lib/data/types";
import { formatNumber, formatRank } from "@/lib/format";

interface ClanSummaryProps {
  detail: ClanDetail;
}

/** 본관 상세 상단의 숫자 요약 그리드 (.stat-grid). */
export default function ClanSummary({ detail }: ClanSummaryProps) {
  const cells: { label: string; value: string }[] = [
    { label: "전체 합격자", value: formatNumber(detail.total) },
    { label: "본관 순위", value: formatRank(detail.rank) },
    { label: "문과", value: formatNumber(detail.mun) },
    { label: "무과", value: formatNumber(detail.mu) },
    { label: "생원", value: formatNumber(detail.saengwon) },
    { label: "진사", value: formatNumber(detail.jinsa) },
    { label: "전성기", value: detail.peakKing.kingName },
    { label: "주요 거주지", value: detail.mainResidence },
  ];

  return (
    <div className="stat-grid" aria-label="본관 요약 통계">
      {cells.map((cell) => (
        <div key={cell.label}>
          <div className="text-xs text-ink-3">{cell.label}</div>
          <div className="font-bold text-foreground">{cell.value}</div>
        </div>
      ))}
    </div>
  );
}
