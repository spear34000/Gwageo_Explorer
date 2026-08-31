import type { ExamColumn, ExamType } from "@/lib/data/types";
import { EXAM_COLUMN_LABELS, EXAM_TYPE_ORDER } from "@/lib/data/types";
import { repository } from "@/lib/data/repository";
import { formatNumber } from "@/lib/format";
import ExamTypeTabs from "@/components/ExamTypeTabs";
import RankingTable from "@/components/RankingTable";

const SORT_KEYS = Object.keys(EXAM_COLUMN_LABELS);

export default async function RankingsPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; exam?: string }>;
}) {
  const { sort, exam } = await searchParams;

  // ExamTypeTabs는 계약상 ?exam= 파라미터로 이동하므로 둘 다 받아들인다.
  const raw =
    typeof sort === "string" ? sort : typeof exam === "string" ? exam : undefined;
  const sortBy: ExamColumn =
    raw && SORT_KEYS.includes(raw) ? (raw as ExamColumn) : "total";

  const all = await repository.clanRanking(sortBy);
  const clans = all.slice(0, 100);
  const totalClans = all.length;

  const counts = await Promise.all(
    EXAM_TYPE_ORDER.map(async (type) => ({
      type,
      count: (await repository.listExamRecords({ examType: type }, 1, 1)).total,
    })),
  );

  const active: ExamType | "all" =
    sortBy === "total" ? "all" : (sortBy as ExamType);

  return (
    <div>
      <h1 className="font-display mb-4 text-2xl font-bold">본관 랭킹</h1>
      <p className="mb-4 text-sm text-ink-3">
        총 {formatNumber(totalClans)}개 본관 · {EXAM_COLUMN_LABELS[sortBy]}{" "}
        합격 기록 기준 TOP 100
      </p>
      <ExamTypeTabs counts={counts} active={active} baseHref="/rankings" />
      <div className="mt-4">
        <RankingTable clans={clans} sortBy={sortBy} />
      </div>
    </div>
  );
}