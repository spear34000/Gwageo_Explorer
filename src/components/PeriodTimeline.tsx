"use client";

import { useEffect } from "react";
import { animate } from "animejs";
import { formatNumber } from "@/lib/format";

interface PeriodTimelineProps {
  data: { label: string; value: number }[];
  max?: number;
}

export default function PeriodTimeline({ data, max }: PeriodTimelineProps) {
  const chartMax = max ?? Math.max(0, ...data.map((d) => d.value));
  const visible = data.filter((d) => d.value > 0);
  const maxVal = Math.max(...visible.map((d) => d.value), 1);

  useEffect(() => {
    animate(".pt-dot2", {
      scale: [0, 1],
      opacity: [0, 1],
      duration: 420,
      // @ts-ignore
      delay: (_el: Element, i: number) => i * 32,
      easing: "outBack",
    } as any);
    animate(".pt-label2", {
      opacity: [0, 1],
      translateY: [4, 0],
      duration: 300,
      // @ts-ignore
      delay: (_el: Element, i: number) => i * 32 + 80,
      easing: "outQuad",
    } as any);
  }, [data, max]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-line" />
        <div className="relative flex items-center justify-between gap-1 overflow-x-auto py-4">
          {data.map((d) => {
            const isPeak = d.value === chartMax && d.value > 0;
            const size = d.value > 0 ? 8 + (d.value / maxVal) * 22 : 6;
            return (
              <div key={d.label} className="flex flex-col items-center gap-1.5 shrink-0">
                <div
                  className={`pt-dot2 flex items-center justify-center rounded-full border-2 bg-background ${isPeak ? "border-accent bg-accent text-white" : d.value > 0 ? "border-accent" : "border-line bg-subtle"}`}
                  style={{ width: size, height: size }}
                  title={`${d.label} ${formatNumber(d.value)}명`}
                >
                  {isPeak && <span className="text-[8px] font-bold">●</span>}
                </div>
                <span className="pt-label2 text-[10px] leading-none text-ink-2 whitespace-nowrap">
                  {d.label}
                </span>
                {d.value > 0 && (
                  <span className="text-[10px] font-medium leading-none text-foreground">
                    {formatNumber(d.value)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <p className="text-xs text-ink-2">
        가장 합격자가 많았던 시기:{" "}
        <span className="font-medium text-foreground">
          {visible.length > 0 ? `${visible.reduce((a, b) => (a.value > b.value ? a : b)).label} ${formatNumber(Math.max(...visible.map((d) => d.value)))}명` : "기록 없음"}
        </span>
      </p>
    </div>
  );
}
