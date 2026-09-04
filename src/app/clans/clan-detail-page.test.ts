import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ReactElement } from "react";
import ClanDetailPage from "./[id]/page";
import { repository } from "@/lib/data/repository";
import { EXAM_TYPE_ORDER, type ExamType } from "@/lib/data/types";

type ClanDetailPageProps = {
  items: unknown[];
  mapRows: unknown[];
  activeExam: ExamType | "all";
};

function pickFilteredClan(clans: Awaited<ReturnType<typeof repository.listClans>>) {
  for (const clan of clans) {
    for (const examType of EXAM_TYPE_ORDER) {
      const count = clan[examType];
      if (count > 0 && count < clan.total) {
        return { clanId: clan.id, examType, filteredTotal: count, clanTotal: clan.total };
      }
    }
  }
  return null;
}

describe("Clan detail page", () => {
  it("keeps full map rows when the table is filtered by exam type", async () => {
    const candidate = pickFilteredClan(await repository.listClans());
    assert.ok(candidate, "expected at least one clan with both filtered and unfiltered rows");

    const page = (await ClanDetailPage({
      params: Promise.resolve({ id: encodeURIComponent(candidate.clanId) }),
      searchParams: Promise.resolve({ exam: candidate.examType }),
    })) as ReactElement<ClanDetailPageProps>;

    assert.equal(page.props.activeExam, candidate.examType);
    assert.equal(page.props.items.length, Math.min(candidate.filteredTotal, 20));
    assert.equal(page.props.mapRows.length, candidate.clanTotal);
  });

  it("filters full clan records by a person or residence query", async () => {
    const clans = await repository.listClans();
    const clan = clans.find((candidate) => candidate.total > 20);
    assert.ok(clan, "expected a clan with records");
    const all = await repository.listExamRecords({ clanId: clan.id }, 1, clan.total);
    const target = all.items[0];
    assert.ok(target, "expected a record");

    const queryFilters = { clanId: clan.id, query: target.personName } as {
      clanId: string;
      query: string;
    };
    const result = await repository.listExamRecords(
      queryFilters,
      1,
      20,
    );

    assert.ok(result.total >= 1);
    assert.ok(result.total < all.total);
    assert.ok(result.items.some((row) => row.personName === target.personName));
  });

  it("exposes ten-year admission age bands", async () => {
    const clan = (await repository.listClans()).find((candidate) => candidate.total > 0);
    assert.ok(clan, "expected a clan with records");
    const detail = await repository.getClan(clan.id);
    assert.ok(detail);

    assert.deepEqual(
      detail.ageStats.map((band) => band.label),
      ["10세 미만", "10대", "20대", "30대", "40대", "50대", "60대", "70대", "80대 이상"],
    );
  });
});
