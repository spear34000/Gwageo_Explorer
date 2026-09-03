import { notFound } from "next/navigation";
import { repository } from "@/lib/data/repository";
import { EXAM_TYPE_ORDER, type ExamType } from "@/lib/data/types";
import ClanDetailClient from "@/components/ClanDetailClient";

const PAGE_SIZE = 20;

function normalizeExam(
  value: string | string[] | undefined,
): ExamType | "all" {
  if (!value) return "all";
  const v = Array.isArray(value) ? value[0] : value;
  if (!v || v === "all") return "all";
  return EXAM_TYPE_ORDER.includes(v as ExamType) ? (v as ExamType) : "all";
}

function normalizePage(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  return Math.max(1, parseInt(raw ?? "1", 10) || 1);
}

export default async function ClanDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { id } = await params;
  // 이 Next 버전은 동적 세그먼트 params를 URL 디코딩하지 않는다
  const clanId = decodeURIComponent(id);
  const detail = await repository.getClan(clanId);
  if (!detail) notFound();

  const sp = await searchParams;
  const activeExam = normalizeExam(sp.exam);
  const examType = activeExam === "all" ? undefined : activeExam;

  const pageNum = normalizePage(sp.page);
  const [{ items, total }, allRows, clanLocations] = await Promise.all([
    repository.listExamRecords(
      { clanId: clanId, examType },
      pageNum,
      PAGE_SIZE,
    ),
    repository.listExamRecords({ clanId: clanId }, 1, detail.total || 1),
    repository.getClanLocations(clanId),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const baseHref = examType
    ? `/clans/${clanId}?exam=${examType}`
    : `/clans/${clanId}`;
  const timelineMax = detail.byKing.reduce((m, k) => Math.max(m, k.count), 0);

  return (
    <ClanDetailClient
      clanId={clanId}
      rawId={id}
      detail={detail}
      items={items}
      mapRows={allRows.items.map(({ year, residence }) => ({ year, residence }))}
      clanLocations={clanLocations}
      totalPages={totalPages}
      pageNum={pageNum}
      baseHref={baseHref}
      activeExam={activeExam}
      timelineMax={timelineMax}
    />
  );
}
