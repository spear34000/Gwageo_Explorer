import { repository } from "@/lib/data/repository";
import SearchBar from "@/components/SearchBar";
import PopularClanLinks from "@/components/PopularClanLinks";
import RankingTable from "@/components/RankingTable";

export default async function Home() {
  const topClans = await repository.topClans("total", 10);
  const popularQueries = await repository.popularSearches();

  return (
    <div>
      <p className="text-sm text-ink-2">
        조선시대 과거시험 합격 기록을 본관별로 집계했습니다
      </p>

      <div className="py-4">
        <SearchBar autoFocus />
      </div>

      <PopularClanLinks queries={popularQueries} />

      <h2 className="font-display mt-10 text-lg font-semibold">
        주요 본관 순위
      </h2>
      <RankingTable clans={topClans} sortBy="total" showRank />
      <p className="mt-3 text-sm">
        <a href="/rankings">전체 순위 보기</a>
      </p>
    </div>
  );
}
