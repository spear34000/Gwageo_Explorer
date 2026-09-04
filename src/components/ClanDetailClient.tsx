"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { animate, type AnimationParams, type FunctionValue } from "animejs";
import { formatNumber } from "@/lib/format";
import { countResidenceRecordsThroughYear, getMapYearRange, summarizeResidencesThroughYear, type MapRecord } from "@/lib/historical-places/residence-timeline";
import type { ClanDetail, ClanLocation, ExamRecordRow, KingCount, ExamTypeStat, ExamType } from "@/lib/data/types";
import AgeDistribution from "./AgeDistribution";
import ClanSummary from "@/components/ClanSummary";
import AIClanSummary from "@/components/AIClanSummary";
import KoreaMap from "@/components/KoreaMap";
import PeriodTimeline from "@/components/PeriodTimeline";
import ExamTypeTabs from "@/components/ExamTypeTabs";
import PersonTable from "@/components/PersonTable";
import Pagination from "@/components/Pagination";

interface Props {
  clanId: string;
  rawId: string;
  detail: ClanDetail;
  items: ExamRecordRow[];
  mapRows: MapRecord[];
  clanLocations: ClanLocation[];
  totalPages: number;
  pageNum: number;
  baseHref: string;
  activeExam: ExamType | "all";
  timelineMax: number;
}

export default function ClanDetailClient({
  clanId,
  rawId,
  detail,
  items,
  mapRows,
  clanLocations,
  totalPages,
  pageNum,
  baseHref,
  activeExam,
  timelineMax,
}: Props) {
  const { min: minYear, max: maxYear } = getMapYearRange(mapRows);
  const [periodEnd, setPeriodEnd] = useState(maxYear);
  const [mapMode, setMapMode] = useState<"all" | "bonGwan" | "residences">("all");
  const detailRootRef = useRef<HTMLDivElement>(null);
  const mapResidences = useMemo(() => summarizeResidencesThroughYear(mapRows, periodEnd), [mapRows, periodEnd]);
  const mapRecordCount = useMemo(() => countResidenceRecordsThroughYear(mapRows, periodEnd), [mapRows, periodEnd]);
  useEffect(() => {
    const detailRoot = detailRootRef.current;
    if (!detailRoot) return;

    const barDelay: FunctionValue<number> = (_target, index = 0) => index * 35;
    const rowDelay: FunctionValue<number> = (_target, index = 0) => index * 28;
    const fadeDelay: FunctionValue<number> = (_target, index = 0) => index * 55;
    const barAnimation: AnimationParams = {
      opacity: [0, 1],
      translateY: [4, 0],
      duration: 500,
      delay: barDelay,
      easing: "outQuad",
    };
    const rowAnimation: AnimationParams = {
      opacity: [0, 1],
      translateY: [6, 0],
      duration: 380,
      delay: rowDelay,
      easing: "outQuad",
    };
    const fadeAnimation: AnimationParams = {
      opacity: [0, 1],
      translateY: [8, 0],
      duration: 480,
      delay: fadeDelay,
      easing: "outQuad",
    };
    const barTargets = detailRoot.querySelectorAll(".bar-row");
    const rowTargets = detailRoot.querySelectorAll(".data-table tbody tr");
    const fadeTargets = detailRoot.querySelectorAll("[data-animate='fade']");
    if (barTargets.length > 0) animate(barTargets, barAnimation);
    if (rowTargets.length > 0) animate(rowTargets, rowAnimation);
    if (fadeTargets.length > 0) animate(fadeTargets, fadeAnimation);
  }, [clanId]);

  return (
    <div ref={detailRootRef} className="space-y-8">
      <div data-animate="fade">
        <Link href="/clans" className="text-sm">
          ← 본관 목록
        </Link>
        <h1 className="mt-1 font-display text-2xl font-bold">{detail.name}</h1>
      </div>

      <div data-animate="fade">
        <AIClanSummary
          clanId={clanId}
          clanName={detail.name}
          rank={detail.rank}
          stats={{
            total: detail.total,
            mun: detail.mun,
            mu: detail.mu,
            saengwon: detail.saengwon,
            jinsa: detail.jinsa,
          }}
        />
      </div>

      <div data-animate="fade" className="grid items-start gap-6 lg:grid-cols-[300px_1fr]">
        <div className="lg:sticky lg:top-4 lg:self-start">
          <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
            {(["all", "bonGwan", "residences"] as const).map((mode) => (
              <button key={mode} type="button" className="btn-secondary px-2 py-1" aria-pressed={mapMode === mode} onClick={() => setMapMode(mode)}>
                {mode === "all" ? "전체" : mode === "bonGwan" ? "본관" : "거주지"}
              </button>
            ))}
            <label className="ml-auto flex items-center gap-2 text-ink-2">
              지도 기준 {periodEnd}년 · 누적 기록 {formatNumber(mapRecordCount)}건
              <input aria-label="지도 연도" type="range" min={minYear} max={maxYear} value={periodEnd} onChange={(event) => setPeriodEnd(Number(event.target.value))} />
            </label>
          </div>
          <KoreaMap residences={mapResidences} bonGwan={detail.bonGwan} mainResidence={detail.mainResidence} markerMode={mapMode} clanLocations={clanLocations} />
          <section className="mt-6">
            <h2 className="mb-3 font-display text-lg">시대별 기록</h2>
            <div className="mb-3 flex gap-px">
              {detail.byKing.map((k) => {
                const intensity = timelineMax > 0 ? k.count / timelineMax : 0;
                return (
                  <div key={k.kingId} className="h-2 flex-1 rounded-sm" style={{ backgroundColor: `rgba(14,77,122,${intensity > 0 ? 0.18 + intensity * 0.82 : 0.06})` }} title={`${k.kingName} ${formatNumber(k.count)}명`} aria-label={`${k.kingName} ${k.count}명`} />
                );
              })}
            </div>
            <PeriodTimeline data={detail.byKing.map((k: KingCount) => ({ label: k.kingName, value: k.count }))} max={timelineMax} />
          </section>
        </div>
        <div className="space-y-6">
          <ClanSummary detail={detail} />
          <section>
            <h2 className="mb-3 font-display text-lg">합격 연령</h2>
            <AgeDistribution stats={detail.ageStats} />
          </section>
          <section>
            <h2 className="mb-3 font-display text-lg">주요 거주지</h2>
            <div className="table-scroll">
              <table className="data-table">
                <caption className="sr-only">주요 거주지 상위 5곳</caption>
                <thead>
                  <tr>
                    <th scope="col">거주지</th>
                    <th scope="col">비율</th>
                    <th scope="col" className="num">합격자 수</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const top5 = detail.residences.slice(0, 5);
                    const maxR = Math.max(...top5.map((r) => r.count), 1);
                    return top5.map((r: { residence: string; count: number }) => (
                      <tr key={r.residence}>
                        <td>{r.residence}</td>
                        <td className="w-32">
                          <span className="bar-track block h-2" role="img" aria-label={`${r.residence} ${r.count}명`}>
                            <span className="bar-fill block h-2" style={{ width: `${(r.count / maxR) * 100}%` }} />
                          </span>
                        </td>
                        <td className="num">{formatNumber(r.count)}</td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>

      <section data-animate="fade">
        <h2 className="mb-3 font-display text-lg">시험 종류</h2>
        <ExamTypeTabs counts={detail.examTypeStats as ExamTypeStat[]} active={activeExam} baseHref={`/clans/${rawId}`} />
      </section>

      <section data-animate="fade">
        <h2 className="mb-3 font-display text-lg">합격자 목록</h2>
        <PersonTable rows={items} />
        <div className="mt-4">
          <Pagination page={pageNum} totalPages={totalPages} baseHref={baseHref} />
        </div>
      </section>

    </div>
  );
}
