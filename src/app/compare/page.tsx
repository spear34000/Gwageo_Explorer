import { repository } from "@/lib/data/repository";
import CompareSelect from "@/components/CompareSelect";
import ComparisonTable from "@/components/ComparisonTable";
import EmptyState from "@/components/EmptyState";

const DEFAULT_A = "전주-이";
const DEFAULT_B = "안동-김";

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ a?: string; b?: string }>;
}) {
  const { a, b } = await searchParams;
  const aId = typeof a === "string" && a.length > 0 ? a : DEFAULT_A;
  const bId = typeof b === "string" && b.length > 0 ? b : DEFAULT_B;

  const comparison = await repository.getComparison(aId, bId);

  if (!comparison) {
    return (
      <div>
        <h1 className="font-display mb-4 text-2xl font-bold">본관 비교</h1>
        <EmptyState message="본관을 찾을 수 없습니다. 목록에서 다른 본관을 선택해 주세요." />
      </div>
    );
  }

  const clanOptions = (await repository.listClans()).map((clan) => ({
    id: clan.id,
    name: clan.name,
  }));

  return (
    <div>
      <h1 className="font-display mb-4 text-2xl font-bold">본관 비교</h1>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <CompareSelect
          value={comparison.a.id}
          options={clanOptions}
          paramName="a"
        />
        <span className="text-sm text-ink-3">vs</span>
        <CompareSelect
          value={comparison.b.id}
          options={clanOptions}
          paramName="b"
        />
      </div>
      <ComparisonTable comparison={comparison} />
    </div>
  );
}