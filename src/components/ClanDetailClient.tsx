"use client";

import Link from "next/link";
import { formatNumber } from "@/lib/format";
import type { ClanDetail, ExamRecordRow, KingCount, ExamTypeStat, ExamType } from "@/lib/data/types";
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
  totalPages,
  pageNum,
  baseHref,
  activeExam,
  timelineMax,
}: Props) {
  return (
    <div className="space-y-8">
      <div>
        <Link href="/clans" className="text-sm">
          ← 본관 목록
        </Link>
        <h1 className="mt-1 font-display text-2xl font-bold">{detail.name}</h1>
      </div>

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

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <KoreaMap residences={detail.residences} bonGwan={detail.bonGwan} mainResidence={detail.mainResidence} />
        <ClanSummary detail={detail} />
      </div>

      <section>
        <h2 className="mb-3 font-display text-lg">시대별 기록</h2>
        <div className="mb-3 flex gap-px">
          {detail.byKing.map((k) => {
            const intensity = timelineMax > 0 ? k.count / timelineMax : 0;
            return (
              <div
                key={k.kingId}
                className="h-2 flex-1 rounded-sm"
                style={{
                  backgroundColor: `rgba(14,77,122,${intensity > 0 ? 0.18 + intensity * 0.82 : 0.06})`,
                }}
                title={`${k.kingName} ${formatNumber(k.count)}명`}
                aria-label={`${k.kingName} ${k.count}명`}
              />
            );
          })}
        </div>
        <PeriodTimeline
          data={detail.byKing.map((k: KingCount) => ({
            label: k.kingName,
            value: k.count,
          }))}
          max={timelineMax}
        />
      </section>

      <section>
        <h2 className="mb-3 font-display text-lg">시험 종류</h2>
        <ExamTypeTabs counts={detail.examTypeStats as ExamTypeStat[]} active={activeExam} baseHref={`/clans/${rawId}`} />
      </section>

      <section>
        <h2 className="mb-3 font-display text-lg">합격자 목록</h2>
        <PersonTable rows={items} />
        <div className="mt-4">
          <Pagination page={pageNum} totalPages={totalPages} baseHref={baseHref} />
        </div>
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
                <th scope="col" className="num">
                  합격자 수
                </th>
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
  );
}
