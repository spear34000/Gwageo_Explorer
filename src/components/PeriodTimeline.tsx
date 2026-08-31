"use client";

import { useEffect } from "react";
import { animate } from "animejs";
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

  useEffect(() => {
    animate(".pt-bar", {
      width: (_el: Element) => (_el as HTMLElement).dataset.w ?? "0%",
      duration: 900,
      // @ts-ignore
      delay: (_el: Element, i: number) => i * 45,
      easing: "outExpo",
    } as any);
    animate(".pt-label", {
      opacity: [0, 1],
      translateX: [-6, 0],
      duration: 400,
      // @ts-ignore
      delay: (_el: Element, i: number) => i * 45 + 120,
      easing: "outQuad",
    } as any);
    animate(".pt-value", {
      opacity: [0, 1],
      duration: 350,
      // @ts-ignore
      delay: (_el: Element, i: number) => i * 45 + 200,
      easing: "outQuad",
    } as any);
  }, [data, max]);

  return (
    <div className="py-1">
      {visible.map((d) => (
        <div key={d.label} className="bar-row">
          <span className="bar-label pt-label">{d.label}</span>
          <span
            className="bar-track"
            role="img"
            aria-label={`${d.label} ${formatNumber(d.value)}명`}
          >
            <span
              className="bar-fill pt-bar block"
              data-w={`${(d.value / scale) * 100}%`}
              style={{ width: `${(d.value / scale) * 100}%` }}
            />
          </span>
          <span className="bar-value pt-value">{formatNumber(d.value)}</span>
        </div>
      ))}
    </div>
  );
}
