"use client";

import type { ExamType } from "@/lib/data/types";
import { EXAM_TYPE_LABELS } from "@/lib/data/types";
import { formatNumber } from "@/lib/format";
import Link from "next/link";

interface ExamTypeTabsProps {
  /** 화면에 표시할 시험 종류 탭 순서 (all 탭은 별도로 "전체 (N)" 추가) */
  counts: { type: ExamType; count: number }[];
  active: ExamType | "all";
  /** 탭 링크의 기준 경로. 이미 쿼리 파라미터(?exam=... 등)를 포함할 수 있다 */
  baseHref: string;
}

/** baseHref에 exam 파라미터를 안전하게 병합한다 (기존 exam 파라미터는 교체) */
function withExamParam(baseHref: string, exam: ExamType | null): string {
  const [path, query = ""] = baseHref.split("?");
  const params = new URLSearchParams(query);
  if (exam === null) {
    params.delete("exam");
  } else {
    params.set("exam", exam);
  }
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

/**
 * 시험 종류 필터 탭. 클라이언트 전환으로 현재 스크롤 위치를 유지한다.
 * "전체 (N)" 탭을 먼저 표시하고, 그 뒤에 counts 순서대로 종류 탭을 붙인다.
 */
export default function ExamTypeTabs({ counts, active, baseHref }: ExamTypeTabsProps) {
  const total = counts.reduce((sum, c) => sum + c.count, 0);

  const tabs: { key: ExamType | "all"; label: string; count: number; href: string }[] = [
    { key: "all", label: "전체", count: total, href: withExamParam(baseHref, null) },
    ...counts.map((c) => ({
      key: c.type,
      label: EXAM_TYPE_LABELS[c.type],
      count: c.count,
      href: withExamParam(baseHref, c.type),
    })),
  ];

  return (
    <div role="tablist" aria-label="시험 종류 필터" className="tab-list">
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          role="tab"
          aria-selected={active === tab.key}
          href={tab.href}
          scroll={false}
          className="tab-btn hover:no-underline"
        >
          {tab.label}
          <span className="tab-count">{formatNumber(tab.count)}</span>
        </Link>
      ))}
    </div>
  );
}
