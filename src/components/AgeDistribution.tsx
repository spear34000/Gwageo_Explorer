import type { AgeBandStat } from "@/lib/data/types";
import { formatNumber } from "@/lib/format";
import PeriodTimeline from "./PeriodTimeline";

export default function AgeDistribution({ stats }: { stats: AgeBandStat[] }) {
  const total = stats.reduce((sum, stat) => sum + stat.count, 0);
  return (
    <div className="rounded-sm border border-line p-4">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <div>
          <h3 className="font-display text-base font-semibold">합격 당시 연령 분포</h3>
          <p className="mt-1 text-xs text-ink-3">출생연도와 합격연도가 모두 확인되는 기록 기준</p>
        </div>
        <span className="shrink-0 text-xs text-ink-3">{formatNumber(total)}건</span>
      </div>
      {total === 0 ? (
        <p className="text-sm text-ink-2">연령을 계산할 수 있는 출생연도 자료가 없습니다.</p>
      ) : (
        <PeriodTimeline
          data={stats.map((stat) => ({ label: stat.label, value: stat.count }))}
          max={Math.max(...stats.map((stat) => stat.count), 0)}
          peakLabel="최다 연령대"
        />
      )}
    </div>
  );
}
