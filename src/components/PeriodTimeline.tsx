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
  const scale = chartMax > 0 ? chartMax : 1;
  const visible = data.filter((d) => d.value > 0);
  const peak = visible.length > 0 ? visible.reduce((a, b) => (a.value > b.value ? a : b)) : null;

  useEffect(() => {
    animate(".pt-vbar", {
      scaleY: [0, 1],
      opacity: [0, 1],
      duration: 700,
      // @ts-ignore
      delay: (_el: Element, i: number) => i * 32,
      easing: "outExpo",
    } as any);
    animate(".pt-vlabel", {
      opacity: [0, 1],
      translateY: [4, 0],
      duration: 350,
      // @ts-ignore
      delay: (_el: Element, i: number) => i * 32 + 180,
      easing: "outQuad",
    } as any);
  }, [data, max]);

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto rounded border border-line bg-subtle/30 p-3">
        <div className="flex items-end gap-[3px] min-w-[560px] h-[180px]">
          {data.map((d) => {
            const h = d.value > 0 ? Math.max(6, (d.value / scale) * 140) : 4;
            const isPeak = peak && d.label === peak.label;
            return (
              <div key={d.label} className="flex flex-1 flex-col items-center gap-1.5">
                <span className="text-[11px] font-medium leading-none text-foreground">
                  {d.value > 0 ? formatNumber(d.value) : ""}
                </span>
                <div
                  className={`pt-vbar w-full rounded-sm origin-bottom ${isPeak ? "bg-accent" : d.value > 0 ? "bg-accent/80" : "bg-line"}`}
                  style={{ height: h }}
                  title={`${d.label} ${d.value}명`}
                />
                <span className="pt-vlabel text-[10px] leading-none text-ink-2 whitespace-nowrap">
                  {d.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      {peak && (
        <p className="text-xs text-ink-2">
          전성기 <span className="font-medium text-foreground">{peak.label} {formatNumber(peak.value)}명</span>
        </p>
      )}
    </div>
  );
}
