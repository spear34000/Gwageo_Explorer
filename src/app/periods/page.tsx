import { repository } from "@/lib/data/repository";
import { formatNumber } from "@/lib/format";

export default async function PeriodsPage() {
  const kings = await repository.listKings();
  const maxTotal = kings.reduce((m, k) => Math.max(m, k.total), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">시대별 기록</h1>
        <p className="mt-1 text-sm text-ink-2">왕대별 과거 합격 기록 수</p>
      </div>

      <div>
        {kings.map(({ king, total }) => (
          <div
            key={king.id}
            className="bar-row [grid-template-columns:8.5rem_1fr_4rem]"
          >
            <div className="bar-label">
              <a href={`/periods/${king.id}`} className="font-bold">
                {king.name}
              </a>
              <span className="block text-xs text-ink-3">
                {king.reignStart}-{king.reignEnd}
              </span>
            </div>
            <div className="bar-track">
              <div
                className="bar-fill"
                style={{
                  width: `${maxTotal > 0 ? (total / maxTotal) * 100 : 0}%`,
                }}
              />
            </div>
            <div className="bar-value">{formatNumber(total)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
