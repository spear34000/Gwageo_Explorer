import type { AgeBandStat } from "@/lib/data/types";
import { formatNumber } from "@/lib/format";

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
        <div className="grid grid-cols-5 items-end gap-2" aria-label="합격 당시 연령 분포">
          {stats.map((stat) => (
            <div key={stat.label} className="flex min-w-0 flex-col items-center gap-1.5 text-xs">
              <span className="tabular-nums text-ink-2">{formatNumber(stat.count)}명</span>
              <span className="flex h-28 w-full items-end rounded-sm bg-[color:var(--line)]/40" role="img" aria-label={`${stat.label} ${formatNumber(stat.count)}명`}>
                <span
                  className="block w-full rounded-t-sm bg-accent transition-[height] duration-500"
                  style={{ height: `${Math.max(stat.ratio * 100, stat.count > 0 ? 3 : 0)}%` }}
                />
              </span>
              <span className="whitespace-nowrap text-ink-2">{stat.label.replace("세", "")}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
