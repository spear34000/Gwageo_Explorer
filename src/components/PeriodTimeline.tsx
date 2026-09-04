"use client";

import { useEffect, useRef } from "react";
import { animate, type AnimationParams, type FunctionValue } from "animejs";
import { formatNumber } from "@/lib/format";

interface PeriodTimelineProps {
  data: { label: string; value: number }[];
  max?: number;
  peakLabel?: string;
}

export default function PeriodTimeline({ data, max, peakLabel = "전성기" }: PeriodTimelineProps) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const chartMax = max ?? Math.max(0, ...data.map((d) => d.value));
  const scale = chartMax > 0 ? chartMax : 1;
  const visible = data.filter((d) => d.value > 0);
  const peak = visible.length > 0 ? visible.reduce((a, b) => (a.value > b.value ? a : b)) : null;

  useEffect(() => {
    if (!timelineRef.current) return;
    const barDelay: FunctionValue<number> = (_target, index = 0) => index * 32;
    const labelDelay: FunctionValue<number> = (_target, index = 0) => index * 32 + 180;
    const barAnimation: AnimationParams = {
      scaleY: [0, 1],
      opacity: [0, 1],
      duration: 700,
      delay: barDelay,
      easing: "outExpo",
    };
    const labelAnimation: AnimationParams = {
      opacity: [0, 1],
      translateY: [4, 0],
      duration: 350,
      delay: labelDelay,
      easing: "outQuad",
    };
    const barTargets = timelineRef.current.querySelectorAll(".pt-vbar");
    const labelTargets = timelineRef.current.querySelectorAll(".pt-vlabel");
    if (barTargets.length > 0) animate(barTargets, barAnimation);
    if (labelTargets.length > 0) animate(labelTargets, labelAnimation);
  }, [data, max]);

  return (
    <div ref={timelineRef} className="space-y-2">
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
          {peakLabel} <span className="font-medium text-foreground">{peak.label} {formatNumber(peak.value)}명</span>
        </p>
      )}
    </div>
  );
}
