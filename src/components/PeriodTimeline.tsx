import { formatNumber } from "@/lib/format";

interface PeriodTimelineProps {
  /** 왕대별 합격자 수. label은 왕 이름. */
  data: { label: string; value: number }[];
  /** 막대 폭 기준이 되는 최대값. 미지정 시 data 전체의 최대값 사용 */
  max?: number;
}

/**
 * 왕대별 합격자 수 막대 차트 (.bar-row 기반, 차트 라이브러리 없음).
 * value가 0인 항목은 숨기되, 막대 비율(max 기준)은 전체 데이터 기준으로 계산한다.
 * 막대 트랙은 role="img" + aria-label("영조 67명")으로 접근성을 확보한다.
 */
export default function PeriodTimeline({ data, max }: PeriodTimelineProps) {
  const chartMax = max ?? Math.max(0, ...data.map((d) => d.value));
  const scale = chartMax > 0 ? chartMax : 1;
  const visible = data.filter((d) => d.value > 0);

  return (
    <div className="py-1">
      {visible.map((d) => (
        <div key={d.label} className="bar-row">
          <span className="bar-label">{d.label}</span>
          <span
            className="bar-track"
            role="img"
            aria-label={`${d.label} ${formatNumber(d.value)}명`}
          >
            <span
              className="bar-fill block"
              style={{ width: `${(d.value / scale) * 100}%` }}
            />
          </span>
          <span className="bar-value">{formatNumber(d.value)}</span>
        </div>
      ))}
    </div>
  );
}
