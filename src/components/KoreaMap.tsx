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

const PLACE_COORDS: Record<string, [number, number]> = {
  "한양": [48, 36], "한성": [48, 36], "서울": [48, 36],
  "개성": [45, 32], "개경": [45, 32],
  "평양": [42, 22], "평안": [42, 24],
  "해주": [38, 32], "황주": [40, 26],
  "의주": [35, 16], "정주": [38, 19],
  "함흥": [55, 19], "함경": [58, 22],
  "원산": [58, 29], "안변": [52, 26],
  "청주": [48, 49], "충주": [50, 46], "공주": [45, 52], "홍주": [42, 54],
  "전주": [45, 66], "나주": [42, 74], "광주": [44, 69], "담양": [46, 72],
  "대구": [58, 59], "경주": [62, 62], "안동": [58, 54], "상주": [55, 52],
  "부산": [65, 72], "동래": [65, 72], "김해": [63, 70], "밀양": [60, 66],
  "진주": [55, 72], "사천": [57, 74], "고성": [62, 49],
  "제주": [45, 98],
  "봉산": [40, 29], "평택": [46, 42], "수원": [47, 39], "인천": [44, 36],
  "강릉": [62, 36], "원주": [55, 42], "춘천": [52, 32],
  "여주": [50, 39], "이천": [50, 42], "안성": [48, 42],
  "파주": [44, 32], "양주": [46, 34], "포천": [48, 30],
  "홍천": [55, 34], "철원": [50, 26],
  "풍천": [40, 26],
};

function normalizePlace(name: string): string {
  return name.split("(")[0].split(" ")[0].trim();
}

function coordFor(place: string): [number, number] | null {
  const key = normalizePlace(place);
  if (PLACE_COORDS[key]) return PLACE_COORDS[key];
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
      <div className="relative overflow-hidden rounded">
        <svg viewBox="0 0 100 120" className="h-auto w-full" role="img" aria-label="한반도 거주지 분포">
          <image
            href="https://commons.wikimedia.org/wiki/Special:FilePath/Korean%20Peninsula%20satellite.png"
            x="0"
            y="0"
            width="100"
            height="120"
            preserveAspectRatio="xMidYMid meet"
            opacity={1}
          />
          {/* Jeju */}
          <ellipse cx="43" cy="115" rx="5" ry="2.8" fill="none" stroke="white" strokeWidth="0.5" opacity={0.9} />
          {/* bonGwan */}
          {bonCoord && (
            <g>
              <circle cx={bonCoord[0]} cy={bonCoord[1]} r="3.6" fill="white" stroke="#0e4d7a" strokeWidth="0.8" />
              <circle cx={bonCoord[0]} cy={bonCoord[1]} r="1.7" fill="#0e4d7a" />
              <text x={bonCoord[0]} y={bonCoord[1] - 5.8} textAnchor="middle" fontSize="3.4" fill="white" stroke="black" strokeWidth="0.4" paintOrder="stroke" fontWeight={700}>
                {bonGwan}
              </text>
            </g>
          )}
          {/* residences */}
          {top.map((r) => {
            const c = coordFor(r.residence);
            if (!c) return null;
            const size = 1.9 + (r.count / max) * 2.4;
            const isMain = r.residence === mainResidence;
            return (
              <g key={r.residence}>
                <circle cx={c[0]} cy={c[1]} r={size + 1.5} fill="white" opacity={0.95} />
                <circle
                  cx={c[0]}
                  cy={c[1]}
                  r={size}
                  fill={isMain ? "#0e4d7a" : "#374151"}
                  stroke="white"
                  strokeWidth="0.45"
                  opacity={isMain ? 1 : 0.92}
                />
              </g>
            );
          })}
        </svg>
        <div className="absolute bottom-1 left-1 rounded bg-white/90 px-1.5 py-0.5 text-[10px] leading-none text-zinc-700 shadow-sm">
          ● 본관 {bonGwan} · ○ 거주지
        </div>
      </div>
      <p className="mt-1.5 text-center text-xs text-ink-2">
        주 거주지: <span className="font-medium text-foreground">{mainResidence}</span>
      </p>
    </div>
  );
}
