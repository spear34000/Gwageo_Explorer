import { repository } from "@/lib/data/repository";
import {
  EXAM_COLUMN_LABELS,
  EXAM_TYPE_ORDER,
  type ExamColumn,
} from "@/lib/data/types";
import { formatNumber } from "@/lib/format";
import SearchBar from "@/components/SearchBar";
import RankingTable from "@/components/RankingTable";
import EmptyState from "@/components/EmptyState";

export default async function ClansPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sort?: string }>;
}) {
  const { q, sort } = await searchParams;
  const query = q?.trim() ?? "";
  const hasQuery = query.length > 0;

  const sortBy: ExamColumn =
    sort && sort in EXAM_COLUMN_LABELS ? (sort as ExamColumn) : "total";

  const ranking = await repository.clanRanking(sortBy);

  return (
    <div>
      <div className="pb-4">
        <SearchBar defaultValue={q ?? ""} />
      </div>

      {hasQuery ? (
        <SearchResults query={query} />
      ) : (
        <section aria-label="본관 목록">
          <h1 className="font-display mb-4 text-2xl font-bold">본관 목록</h1>
          <RankingTable clans={ranking} sortBy={sortBy} />
        </section>
      )}
    </div>
  );
}

async function SearchResults({ query }: { query: string }) {
  const results = await repository.searchClans(query);

  if (results.length === 0) {
    return (
      <>
        <h1 className="font-display mb-4 text-2xl font-bold">
          &quot;{query}&quot; 검색 결과
        </h1>
        <EmptyState message="일치하는 본관이 없습니다. 다른 검색어를 시도해 보세요." />
      </>
    );
  }

  return (
    <section aria-label={`"${query}" 검색 결과`}>
      <h1 className="font-display mb-4 text-2xl font-bold">
        &quot;{query}&quot; 검색 결과
      </h1>
      <ul className="divide-y divide-line border-y border-line">
        {results.map(({ clan, matchLabel }) => (
          <li key={clan.id} className="py-3">
            <a href={`/clans/${clan.id}`} className="font-medium text-accent">
              {clan.name}
            </a>
            <span className="ml-2 text-xs text-ink-3">{matchLabel}</span>
            <p className="mt-1 text-sm text-ink-2">
              전체 {formatNumber(clan.total)}명 ·{" "}
              {EXAM_TYPE_ORDER.map(
                (type) =>
                  `${EXAM_COLUMN_LABELS[type]} ${formatNumber(clan[type])}`,
              ).join(" · ")}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
