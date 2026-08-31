"use client";

import Link from "next/link";
import { formatNumber } from "@/lib/format";
import type { ClanDetail, ClanNotable, ExamRecordRow, KingCount, ExamTypeStat, ExamType } from "@/lib/data/types";
import ClanSummary from "@/components/ClanSummary";
import AIClanSummary from "@/components/AIClanSummary";
import PeriodTimeline from "@/components/PeriodTimeline";
import ExamTypeTabs from "@/components/ExamTypeTabs";
import PersonTable from "@/components/PersonTable";
import Pagination from "@/components/Pagination";

interface Props {
  clanId: string;
  rawId: string;
  detail: ClanDetail;
  notables: ClanNotable[];
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
  notables,
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

      <ClanSummary detail={detail} />

      <section>
        <h2 className="mb-3 font-display text-lg">시대별 기록</h2>
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
                <th scope="col" className="num">
                  합격자 수
                </th>
              </tr>
            </thead>
            <tbody>
              {detail.residences.slice(0, 5).map((r: { residence: string; count: number }) => (
                <tr key={r.residence}>
                  <td>{r.residence}</td>
                  <td className="num">{formatNumber(r.count)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {notables.length > 0 && (
        <section>
          <h2 className="mb-3 font-display text-lg">유명 인물</h2>
          <div className="table-scroll">
            <table className="data-table">
              <caption className="sr-only">본관 출신 유명 인물</caption>
              <thead>
                <tr>
                  <th scope="col">인물</th>
                  <th scope="col">설명</th>
                </tr>
              </thead>
              <tbody>
                {notables.map((n) => (
                  <tr key={n.id}>
                    <td>
                      {n.name}
                      {n.birthYear
                        ? ` (${n.birthYear}${n.deathYear ? `–${n.deathYear}` : ""})`
                        : ""}
                    </td>
                    <td>{n.description ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
