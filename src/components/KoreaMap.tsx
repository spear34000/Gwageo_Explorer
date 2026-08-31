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
      <div className="relative overflow-hidden rounded border border-line bg-transparent">
        <svg viewBox="0 0 100 140" className="h-auto w-full" role="img" aria-label="한반도 거주지 분포">
          <defs>
            <clipPath id="korClip">
              <path d="M 38 10 L 46 7 L 54 6 L 62 9 L 68 14 L 72 20 L 73 28 L 72 36 L 69 44 L 65 52 L 61 60 L 57 68 L 54 76 L 51 84 L 49 92 L 47 100 L 45 108 L 43 116 L 40 124 L 35 128 L 28 122 L 22 110 L 16 92 L 12 78 L 10 62 L 12 48 L 16 34 L 22 22 L 30 14 Z" />
            </clipPath>
          </defs>
          {/* satellite base - NASA Blue Marble via Wikimedia */}
          <image
            href="https://commons.wikimedia.org/wiki/Special:FilePath/Korean%20Peninsula%20satellite.png"
            x="8"
            y="4"
            width="68"
            height="126"
            preserveAspectRatio="xMidYMid slice"
            clipPath="url(#korClip)"
            opacity={0.96}
          />
          {/* Jeju */}
          <ellipse cx="42" cy="129" rx="6.5" ry="3.8" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-line" />
          {/* bonGwan star - white on satellite */}
          {bonCoord && (
            <g>
              <circle cx={bonCoord[0]} cy={bonCoord[1]} r="3.4" fill="white" stroke="#0e4d7a" strokeWidth="0.7" />
              <circle cx={bonCoord[0]} cy={bonCoord[1]} r="1.6" className="fill-accent" />
              <text x={bonCoord[0]} y={bonCoord[1] - 5.5} textAnchor="middle" fontSize="3.3" fill="white" stroke="black" strokeWidth="0.35" paintOrder="stroke" fontWeight={700}>
                {bonGwan}
              </text>
            </g>
          )}
          {/* residences - white with glow on satellite */}
          {top.map((r) => {
            const c = coordFor(r.residence);
            if (!c) return null;
            const size = 1.9 + (r.count / max) * 2.6;
            const isMain = r.residence === mainResidence;
            return (
              <g key={r.residence}>
                <circle cx={c[0]} cy={c[1]} r={size + 1.4} fill="white" opacity={0.92} />
                <circle
                  cx={c[0]}
                  cy={c[1]}
                  r={size}
                  fill={isMain ? "#0e4d7a" : "#1f2937"}
                  stroke="white"
                  strokeWidth="0.4"
                  opacity={isMain ? 1 : 0.88}
                />
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
