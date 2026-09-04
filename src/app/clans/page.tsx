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
import { SEARCH_RESULT_COLUMNS } from "@/lib/search-results";

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

  return (
    <div>
      <div className="pb-4">
        <SearchBar defaultValue={q ?? ""} />
      </div>

      {hasQuery ? (
        <SearchResults query={query} />
      ) : (
        <ClanRankingSection sortBy={sortBy} />
      )}
    </div>
  );
}

async function ClanRankingSection({ sortBy }: { sortBy: ExamColumn }) {
  const ranking = await repository.clanRanking(sortBy);
  return (
    <section aria-label="본관 목록">
      <h1 className="font-display mb-4 text-2xl font-bold">본관 목록</h1>
      <RankingTable clans={ranking} sortBy={sortBy} />
    </section>
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
      <div className="table-scroll">
        <table className="data-table min-w-[720px]">
          <caption className="sr-only">{query} 검색 결과 본관별 합격 통계</caption>
          <thead>
            <tr>
              {SEARCH_RESULT_COLUMNS.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={column.numeric ? "num" : undefined}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {results.map(({ clan, matchLabel }) => (
              <tr key={clan.id}>
                <td>
                  <a href={`/clans/${clan.id}`} className="font-medium text-accent">
                    {clan.name}
                  </a>
                </td>
                <td className="text-xs text-ink-3">{matchLabel}</td>
                <td className="num font-medium">{formatNumber(clan.total)}</td>
                {EXAM_TYPE_ORDER.map((type) => (
                  <td key={type} className="num">
                    {formatNumber(clan[type])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
