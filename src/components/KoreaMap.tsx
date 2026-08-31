"use client";

interface Residence {
  residence: string;
  count: number;
}

interface KoreaMapProps {
  residences: Residence[];
  bonGwan: string;
  mainResidence: string;
  className?: string;
}

// historical place -> approx % within viewBox 0 0 100 140
const PLACE_COORDS: Record<string, [number, number]> = {
  "한양": [48, 32], "한성": [48, 32], "서울": [48, 32],
  "개성": [45, 28], "개경": [45, 28],
  "평양": [42, 18], "평안": [42, 20],
  "해주": [38, 28], "황주": [40, 22],
  "의주": [35, 12], "정주": [38, 15],
  "함흥": [55, 15], "함경": [58, 18],
  "원산": [58, 25], "안변": [52, 22],
  "청주": [48, 45], "충주": [50, 42], "공주": [45, 48], "홍주": [42, 50],
  "전주": [45, 62], "나주": [42, 70], "광주": [44, 65], "담양": [46, 68],
  "대구": [58, 55], "경주": [62, 58], "안동": [58, 50], "상주": [55, 48],
  "부산": [65, 68], "동래": [65, 68], "김해": [63, 66], "밀양": [60, 62],
  "진주": [55, 68], "사천": [57, 70], "고성": [62, 45],
  "제주": [45, 95],
  "봉산": [40, 25], "평택": [46, 38], "수원": [47, 35], "인천": [44, 32],
  "강릉": [62, 32], "원주": [55, 38], "춘천": [52, 28],
  "여주": [50, 35], "이천": [50, 38], "안성": [48, 38],
  "파주": [44, 28], "양주": [46, 30], "포천": [48, 26],
  "홍천": [55, 30], "철원": [50, 22],
};

function normalizePlace(name: string): string {
  return name.split("(")[0].split(" ")[0].trim();
}

function coordFor(place: string): [number, number] | null {
  const key = normalizePlace(place);
  if (PLACE_COORDS[key]) return PLACE_COORDS[key];
  // try without suffix like "군", "현" etc - take first 2 chars
  const short = key.slice(0, 2);
  if (PLACE_COORDS[short]) return PLACE_COORDS[short];
  return null;
}

export default function KoreaMap({ residences, bonGwan, mainResidence, className }: KoreaMapProps) {
  const top = residences.slice(0, 5).filter((r) => r.residence !== "기록 없음");
  const max = Math.max(...top.map((r) => r.count), 1);
  const bonCoord = PLACE_COORDS[bonGwan] ?? null;

  return (
    <div className={className}>
      <div className="relative overflow-hidden rounded border border-line bg-subtle">
        <svg viewBox="0 0 100 140" className="h-auto w-full" role="img" aria-label="한반도 거주지 분포">
          {/* peninsula outline - simplified */}
          <path
            d="M 38 8 L 52 6 L 62 12 L 68 22 L 70 30 L 68 38 L 65 45 L 62 52 L 58 60 L 55 70 L 50 85 L 48 100 L 45 115 L 40 125 L 32 122 L 28 110 L 22 90 L 18 70 L 15 50 L 18 35 L 25 20 L 32 12 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.6"
            className="text-line"
          />
          {/* Jeju */}
          <ellipse cx="42" cy="128" rx="6" ry="3.5" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-line" />
          {/* bonGwan star */}
          {bonCoord && (
            <g>
              <circle cx={bonCoord[0]} cy={bonCoord[1]} r="3.2" className="fill-accent" />
              <text x={bonCoord[0]} y={bonCoord[1] - 5} textAnchor="middle" fontSize="3.2" className="fill-accent font-bold">
                {bonGwan}
              </text>
            </g>
          )}
          {/* residences */}
          {top.map((r) => {
            const c = coordFor(r.residence);
            if (!c) return null;
            const size = 1.8 + (r.count / max) * 2.8;
            const isMain = r.residence === mainResidence;
            return (
              <g key={r.residence}>
                <circle
                  cx={c[0]}
                  cy={c[1]}
                  r={size}
                  className={isMain ? "fill-accent" : "fill-ink-2"}
                  opacity={isMain ? 0.95 : 0.72}
                />
                <circle cx={c[0]} cy={c[1]} r={size + 1.2} fill="none" stroke="currentColor" strokeWidth="0.35" className={isMain ? "text-accent" : "text-ink-2"} opacity={0.45} />
              </g>
            );
          })}
        </svg>
        <div className="absolute bottom-1 left-1 rounded bg-background/90 px-1.5 py-0.5 text-[10px] leading-none text-ink-2">
          ● 본관 {bonGwan} · ○ 거주지
        </div>
      </div>
      <p className="mt-1.5 text-center text-xs text-ink-2">
        주 거주지: <span className="font-medium text-foreground">{mainResidence}</span>
        {bonCoord ? ` · 본관: ${bonGwan}` : ""}
      </p>
    </div>
  );
}
