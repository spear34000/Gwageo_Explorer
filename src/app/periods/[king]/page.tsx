import { notFound } from "next/navigation";
import Link from "next/link";
import { repository } from "@/lib/data/repository";
import { formatNumber } from "@/lib/format";

export default async function PeriodKingPage({
  params,
}: {
  params: Promise<{ king: string }>;
}) {
  const { king } = await params;
  const kingInfo = (await repository.listKings()).find((k) => k.king.id === king);
  if (!kingInfo) notFound();

  const ranking = (await repository.periodRanking(king)).slice(0, 20);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/periods" className="text-sm">
          ← 전체 시대별 보기
        </Link>
        <h1 className="mt-1 font-display text-2xl font-bold">
          {kingInfo.king.name} 시대 과거 합격자 본관 순위
        </h1>
        <p className="mt-1 text-sm text-ink-2">
          재위 {kingInfo.king.reignStart}-{kingInfo.king.reignEnd} · 총{" "}
          {formatNumber(kingInfo.total)}건
        </p>
      </div>

      <div className="table-scroll">
        <table className="data-table">
          <caption className="sr-only">
            {kingInfo.king.name} 시대 본관별 합격자 순위
          </caption>
          <thead>
            <tr>
              <th scope="col" className="num">
                순위
              </th>
              <th scope="col">본관</th>
              <th scope="col" className="num">
                합격자 수
              </th>
            </tr>
          </thead>
          <tbody>
            {ranking.map((r, i) => (
              <tr key={r.clanId}>
                <td
                  className={`num ${i === 0 ? "font-bold text-accent" : ""}`}
                >
                  {i + 1}
                </td>
                <td className={i === 0 ? "font-bold" : ""}>
                  <a href={`/clans/${r.clanId}`}>{r.clanName}</a>
                </td>
                <td
                  className={`num ${i === 0 ? "font-bold text-accent" : ""}`}
                >
                  {formatNumber(r.count)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
