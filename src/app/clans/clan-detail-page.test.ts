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
});
