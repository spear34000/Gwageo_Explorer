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

  const W = 100;
  const H = 52;
  const padL = 2, padR = 2, padT = 6, padB = 16;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const step = data.length > 1 ? innerW / (data.length - 1) : 0;

  const points = data.map((d, i) => {
    const x = padL + i * step;
    const y = padT + innerH - (d.value / scale) * innerH;
    return { x, y, d };
  });

  const lineD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" ");
  const areaD = `${lineD} L ${points[points.length - 1].x.toFixed(2)} ${padT + innerH} L ${points[0].x.toFixed(2)} ${padT + innerH} Z`;

  useEffect(() => {
    const line = document.querySelector<SVGPathElement>(".pt-line");
    if (line) {
      const len = line.getTotalLength();
      line.style.strokeDasharray = `${len}`;
      line.style.strokeDashoffset = `${len}`;
      animate(line, {
        strokeDashoffset: [len, 0],
        duration: 900,
        easing: "outQuad",
      } as any);
    }
    animate(".pt-area", {
      opacity: [0, 1],
      duration: 600,
      delay: 150,
      easing: "outQuad",
    } as any);
    animate(".pt-dot", {
      opacity: [0, 1],
      duration: 400,
      // @ts-ignore
      delay: (_el: Element, i: number) => 300 + i * 18,
      easing: "outQuad",
    } as any);
  }, [data, max]);

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="min-w-[640px] w-full h-[220px]" role="img" aria-label="시대별 합격자 추이">
          <defs>
            <linearGradient id="ptAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0e4d7a" stopOpacity={0.32} />
              <stop offset="100%" stopColor="#0e4d7a" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          {[0, 0.5, 1].map((t) => {
            const y = padT + innerH * (1 - t);
            return <line key={t} x1={padL} x2={W - padR} y1={y} y2={y} stroke="currentColor" className="text-line" strokeWidth={0.25} opacity={0.5} />;
          })}
          <path d={areaD} fill="url(#ptAreaGrad)" className="pt-area" opacity={0} />
          <path d={lineD} fill="none" stroke="#0e4d7a" strokeWidth={1.4} strokeLinejoin="round" strokeLinecap="round" className="pt-line" />
          {points.map((p) => (
            <circle key={p.d.label} cx={p.x} cy={p.y} r={p.d.value > 0 ? 1.9 : 1.2} fill={p.d.value > 0 ? "#0e4d7a" : "#9ca3af"} stroke="white" strokeWidth={0.6} className="pt-dot" opacity={0}>
              <title>{`${p.d.label} ${formatNumber(p.d.value)}명`}</title>
            </circle>
          ))}
          {points.map((p) => (
            <text key={`l-${p.d.label}`} x={p.x} y={H - 2} textAnchor="middle" fontSize="2.6" className="fill-ink-2">
              {p.d.label}
            </text>
          ))}
        </svg>
      </div>
      <div className="flex flex-wrap gap-1.5 text-xs text-ink-2">
        {data.filter((d) => d.value > 0).slice(0, 6).map((d) => (
          <span key={d.label} className="rounded bg-subtle px-1.5 py-0.5">
            {d.label} <span className="font-medium text-foreground">{formatNumber(d.value)}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
