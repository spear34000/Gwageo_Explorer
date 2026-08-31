"use client";

import { useEffect } from "react";
import { animate } from "animejs";
import { formatNumber } from "@/lib/format";

interface PeriodTimelineProps {
  data: { label: string; value: number }[];
  max?: number;
}

function catmullPath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return "";
  let d = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[0];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return d;
}

export default function PeriodTimeline({ data, max }: PeriodTimelineProps) {
  const chartMax = max ?? Math.max(0, ...data.map((d) => d.value));
  const scale = chartMax > 0 ? chartMax : 1;

  const W = 100;
  const H = 48;
  const padL = 1.5, padR = 1.5, padT = 6, padB = 16;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const step = data.length > 1 ? innerW / (data.length - 1) : 0;

  const points = data.map((d, i) => ({
    x: padL + i * step,
    y: padT + innerH - (d.value / scale) * innerH * 0.92,
    v: d.value,
    label: d.label,
  }));

  const lineD = catmullPath(points);
  const areaD = `${lineD} L ${points[points.length - 1].x.toFixed(2)} ${padT + innerH} L ${points[0].x.toFixed(2)} ${padT + innerH} Z`;
  const peak = data.reduce((a, b) => (a.value > b.value ? a : b), data[0]);

  useEffect(() => {
    const line = document.querySelector<SVGPathElement>(".pt-mountain-line");
    if (line) {
      const len = line.getTotalLength();
      line.style.strokeDasharray = `${len}`;
      line.style.strokeDashoffset = `${len}`;
      animate(line, { strokeDashoffset: [len, 0], duration: 1400, easing: "outExpo" } as any);
    }
    animate(".pt-mountain-area", { opacity: [0, 1], duration: 800, delay: 300, easing: "outQuad" } as any);
    animate(".pt-peak", { scale: [0, 1], opacity: [0, 1], duration: 500, delay: 900, easing: "outBack" } as any);
  }, [data, max]);

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto rounded border border-line bg-subtle/40">
        <svg viewBox={`0 0 ${W} ${H}`} className="min-w-[640px] w-full h-[200px]" role="img" aria-label="시대별 합격자 산맥">
          <defs>
            <linearGradient id="mountGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0e4d7a" stopOpacity={0.45} />
              <stop offset="55%" stopColor="#0e4d7a" stopOpacity={0.18} />
              <stop offset="100%" stopColor="#0e4d7a" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="mountStroke" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0e4d7a" stopOpacity={1} />
              <stop offset="100%" stopColor="#143760" stopOpacity={1} />
            </linearGradient>
          </defs>
          {[0, 0.5, 1].map((t) => {
            const y = padT + innerH * (1 - t);
            return <line key={t} x1={padL} x2={W - padR} y1={y} y2={y} stroke="currentColor" className="text-line" strokeWidth={0.2} opacity={0.35} />;
          })}
          <path d={areaD} fill="url(#mountGrad)" className="pt-mountain-area" opacity={0} />
          <path d={lineD} fill="none" stroke="url(#mountStroke)" strokeWidth={1.6} strokeLinejoin="round" strokeLinecap="round" className="pt-mountain-line" />
          {points.map((p) => (
            <circle key={p.label} cx={p.x} cy={p.y} r={p.v === peak.value && p.v > 0 ? 1.9 : p.v > 0 ? 1.1 : 0.7} fill={p.v > 0 ? "#0e4d7a" : "#cbd5e1"} stroke="white" strokeWidth={0.5} opacity={0.95} />
          ))}
          {points.filter((p) => p.v === peak.value && p.v > 0).map((p) => (
            <g key={`peak-${p.label}`} className="pt-peak" opacity={0}>
              <circle cx={p.x} cy={p.y} r={3.2} fill="none" stroke="#0e4d7a" strokeWidth={0.5} opacity={0.35} />
              <circle cx={p.x} cy={p.y} r={5} fill="none" stroke="#0e4d7a" strokeWidth={0.3} opacity={0.2} />
            </g>
          ))}
          {points.map((p) => (
            <text key={`l-${p.label}`} x={p.x} y={H - 2.5} textAnchor="middle" fontSize="2.3" className="fill-ink-2">
              {p.label}
            </text>
          ))}
        </svg>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-ink-2">
          전성기 <span className="font-medium text-foreground">{peak.label} {formatNumber(peak.value)}명</span>
        </span>
        <span className="text-ink-3">곡선의 높이가 합격자 수</span>
      </div>
    </div>
  );
}
