import type {
  ClanComparison,
  ClanDetail,
  ClanSearchResult,
  ClanSummary,
  DataRepository,
  ExamColumn,
  ExamRecordRow,
  ExamType,
  KingCount,
  KingInfo,
  PersonDetail,
  PeriodClanRank,
  RelationInfo,
} from "./types";
import { EXAM_TYPE_ORDER } from "./types";
import { KINGS, getKing, reignYear } from "./kings";
import { CLAN_ROSTER } from "./clan-roster";
import { searchClansIn } from "../search";
import { EXAM_SEEDS, PERSON_SEEDS, RELATION_SEEDS } from "./mock-data";
import { prisma } from "./db";

const RELATION_LABELS: Record<string, string> = {
  father: "아버지",
  son: "아들",
  brother: "형제",
  elderBrother: "형",
  youngerBrother: "아우",
  uncle: "숙부",
  nephew: "조카",
  cousin: "사촌",
  grandfather: "할아버지",
  grandson: "손자",
  "great-grandfather": "증조부",
  "great-grandson": "증손",
  "maternal-grandfather": "외조부",
  "maternal-grandson": "외손자",
  "father-in-law": "장인",
  "son-in-law": "사위",
};

function relationLabel(type: string): string {
  return RELATION_LABELS[type] ?? type;
}

/** 관계의 역방향. 관련 인물 표시에서 관점 반전에 사용한다 */
const INVERSE_RELATION: Record<string, string> = {
  father: "son",
  son: "father",
  brother: "brother",
  elderBrother: "youngerBrother",
  youngerBrother: "elderBrother",
  uncle: "nephew",
  nephew: "uncle",
  cousin: "cousin",
  grandfather: "grandson",
  grandson: "grandfather",
  "great-grandfather": "great-grandson",
  "great-grandson": "great-grandfather",
  "maternal-grandfather": "maternal-grandson",
  "maternal-grandson": "maternal-grandfather",
  "father-in-law": "son-in-law",
  "son-in-law": "father-in-law",
};

function invertRelationType(type: string): string {
  return INVERSE_RELATION[type] ?? type;
}

/** 실데이터 기준 본관 이름 ("안동 김씨", 본관 미상이면 "김씨 (본관 미상)") */
function clanDisplayName(bonGwan: string, surname: string): string {
  return bonGwan && bonGwan !== "미상"
    ? `${bonGwan} ${surname}씨`
    : `${surname}씨 (본관 미상)`;
}

const CLAN_BY_ID = new Map(CLAN_ROSTER.map((c) => [c.id, c]));

/** mock 로스터 기반 본관 이름 (MockDataRepository 전용) */
function clanNameOf(clanId: string): string {
  const clan = CLAN_BY_ID.get(clanId);
  return clan ? `${clan.bonGwan} ${clan.surname}씨` : clanId;
}

/** 합격 기록 행에서 본관 집계를 만든다 (데이터에 존재하는 본관만 포함) */
function buildClanSummaries(rows: ExamRecordRow[]): ClanSummary[] {
  const byClan = new Map<
    string,
    { row: ExamRecordRow; mun: number; mu: number; saengwon: number; jinsa: number }
  >();
  for (const row of rows) {
    const entry =
      byClan.get(row.clanId) ?? { row, mun: 0, mu: 0, saengwon: 0, jinsa: 0 };
    entry[row.type] += 1;
    byClan.set(row.clanId, entry);
  }

  const clans: ClanSummary[] = [...byClan.values()].map((e) => ({
    id: e.row.clanId,
    surname: e.row.surname,
    bonGwan: e.row.bonGwan,
    name: e.row.clanName,
    total: e.mun + e.mu + e.saengwon + e.jinsa,
    mun: e.mun,
    mu: e.mu,
    saengwon: e.saengwon,
    jinsa: e.jinsa,
    rank: 0,
  }));

  clans.sort((a, b) => b.total - a.total);
  clans.forEach((c, i) => {
    c.rank = i + 1;
  });
  return clans;
}

function rankByColumn(clans: ClanSummary[], column: ExamColumn): ClanSummary[] {
  const sorted = [...clans].sort((a, b) => b[column] - a[column]);
  return sorted.map((c, i) => ({ ...c, rank: i + 1 }));
}

function buildClanDetail(clan: ClanSummary, rows: ExamRecordRow[]): ClanDetail {
  const clanRows = rows.filter((r) => r.clanId === clan.id);

  const kingCounts = new Map<string, number>();
  const residenceCounts = new Map<string, number>();
  for (const row of clanRows) {
    kingCounts.set(row.kingId, (kingCounts.get(row.kingId) ?? 0) + 1);
    const res = row.residence || "기록 없음";
    residenceCounts.set(res, (residenceCounts.get(res) ?? 0) + 1);
  }

  const byKing: KingCount[] = KINGS.map((king) => ({
    kingId: king.id,
    kingName: king.name,
    count: kingCounts.get(king.id) ?? 0,
  }));

  const examTypeStats = EXAM_TYPE_ORDER.map((type) => {
    const count = clan[type];
    return {
      type,
      count,
      ratio: clan.total > 0 ? count / clan.total : 0,
    };
  });

  const residences = [...residenceCounts.entries()]
    .map(([residence, count]) => ({ residence, count }))
    .sort((a, b) => b.count - a.count);

  const peakKing = byKing.reduce(
    (max, k) => (k.count > max.count ? k : max),
    byKing[0],
  );

  return {
    ...clan,
    byKing,
    examTypeStats,
    residences,
    peakKing,
    mainResidence: residences[0]?.residence ?? "기록 없음",
  };
}

abstract class BaseClanRepository implements DataRepository {
  abstract readonly isDemoData: boolean;

  protected abstract loadRows(): Promise<ExamRecordRow[]>;
  protected abstract resolveClanName(clanId: string): string;

  protected async loadSummaries(): Promise<ClanSummary[]> {
    const rows = await this.loadRows();
    return buildClanSummaries(rows);
  }

  async listClans(): Promise<ClanSummary[]> {
    const summaries = await this.loadSummaries();
    return summaries.map((c) => ({ ...c }));
  }

  async getClan(id: string): Promise<ClanDetail | null> {
    const [rows, summaries] = await Promise.all([
      this.loadRows(),
      this.loadSummaries(),
    ]);
    const summary = summaries.find((c) => c.id === id);
    if (!summary) return null;
    return buildClanDetail(summary, rows);
  }

  async clanRanking(sortBy: ExamColumn): Promise<ClanSummary[]> {
    return rankByColumn(await this.loadSummaries(), sortBy);
  }

  async searchClans(query: string): Promise<ClanSearchResult[]> {
    return searchClansIn(await this.loadSummaries(), query);
  }

  async listExamRecords(
    filters: { clanId?: string; examType?: ExamType; kingId?: string },
    page: number,
    pageSize: number,
  ): Promise<{ items: ExamRecordRow[]; total: number }> {
    const rows = await this.loadRows();
    let filtered = rows;
    if (filters.clanId)
      filtered = filtered.filter((r) => r.clanId === filters.clanId);
    if (filters.examType)
      filtered = filtered.filter((r) => r.type === filters.examType);
    if (filters.kingId)
      filtered = filtered.filter((r) => r.kingId === filters.kingId);

    const total = filtered.length;
    const start = (page - 1) * pageSize;
    return { items: filtered.slice(start, start + pageSize), total };
  }

  async listKings(): Promise<KingInfo[]> {
    const rows = await this.loadRows();
    return KINGS.map((king) => ({
      king,
      total: rows.filter((r) => r.kingId === king.id).length,
    }));
  }

  async periodRanking(kingId: string): Promise<PeriodClanRank[]> {
    const rows = await this.loadRows();
    const counts = new Map<string, number>();
    for (const row of rows) {
      if (row.kingId !== kingId) continue;
      counts.set(row.clanId, (counts.get(row.clanId) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([clanId, count]) => ({
        clanId,
        clanName: this.resolveClanName(clanId),
        count,
      }))
      .sort((a, b) => b.count - a.count);
  }

  async topClans(examColumn: ExamColumn, limit: number): Promise<ClanSummary[]> {
    return rankByColumn(await this.loadSummaries(), examColumn).slice(0, limit);
  }

  async getComparison(aId: string, bId: string): Promise<ClanComparison | null> {
    const [rows, summaries] = await Promise.all([
      this.loadRows(),
      this.loadSummaries(),
    ]);
    const aSummary = summaries.find((c) => c.id === aId);
    const bSummary = summaries.find((c) => c.id === bId);
    if (!aSummary || !bSummary) return null;

    const aDetail = buildClanDetail(aSummary, rows);
    const bDetail = buildClanDetail(bSummary, rows);

    return {
      a: aSummary,
      b: bSummary,
      peakKings: {
        a: `${aDetail.peakKing.kingName} (${aDetail.peakKing.count}명)`,
        b: `${bDetail.peakKing.kingName} (${bDetail.peakKing.count}명)`,
      },
      mainResidences: { a: aDetail.mainResidence, b: bDetail.mainResidence },
    };
  }

  abstract getPerson(id: string): Promise<PersonDetail | null>;
  abstract popularSearches(): Promise<string[]>;
}

/** seed 기반 메모리 저장소. DB가 없거나 DATA_SOURCE=mock일 때 사용한다 */
class MockDataRepository extends BaseClanRepository {
  readonly isDemoData = true;

  private readonly personById = new Map(PERSON_SEEDS.map((p) => [p.id, p]));

  private readonly allExamRows: ExamRecordRow[] = EXAM_SEEDS.map((exam) => {
    const person = this.personById.get(exam.personId);
    const king = getKing(exam.kingId);
    return {
      id: exam.id,
      personId: exam.personId,
      personName: person?.name ?? "이름 없음",
      surname: person?.surname ?? "",
      bonGwan: person?.bonGwan ?? "",
      clanId: person?.clanId ?? "",
      clanName: person ? clanNameOf(person.clanId) : "",
      type: exam.type,
      year: exam.year,
      kingId: exam.kingId,
      kingName: king?.name ?? exam.kingId,
      reignYear: reignYear(exam.kingId, exam.year),
      grade: exam.grade,
      residence: person?.residence ?? "",
    };
  }).sort(
    (a, b) =>
      b.year - a.year || a.personName.localeCompare(b.personName, "ko"),
  );

  private readonly clanSummaries = buildClanSummaries(this.allExamRows);

  protected async loadRows(): Promise<ExamRecordRow[]> {
    return this.allExamRows;
  }

  protected resolveClanName(clanId: string): string {
    return CLAN_BY_ID.get(clanId)?.name ?? clanId;
  }

  protected override async loadSummaries(): Promise<ClanSummary[]> {
    return this.clanSummaries;
  }

  async getPerson(id: string): Promise<PersonDetail | null> {
    const person = this.personById.get(id);
    if (!person) return null;

    const exams = this.allExamRows.filter((r) => r.personId === id);

    const toRelation = (r: {
      personId: string;
      relatedPersonId: string;
      type: string;
    }): RelationInfo => {
      const target = this.personById.get(
        r.personId === id ? r.relatedPersonId : r.personId,
      );
      return {
        personId: target?.id ?? "",
        personName: target?.name ?? "이름 없음",
        clanName: target ? clanNameOf(target.clanId) : "",
        type: r.type,
        relationLabel: relationLabel(r.type),
      };
    };

    const relations = RELATION_SEEDS.filter((r) => r.personId === id).map(
      toRelation,
    );
    const relatedBy = RELATION_SEEDS.filter(
      (r) => r.relatedPersonId === id,
    ).map(toRelation);

    return {
      id: person.id,
      name: person.name,
      surname: person.surname,
      bonGwan: person.bonGwan,
      clanId: person.clanId,
      clanName: clanNameOf(person.clanId),
      residence: person.residence,
      birthYear: person.birthYear,
      deathYear: person.deathYear,
      exams,
      relations,
      relatedBy,
    };
  }

  async popularSearches(): Promise<string[]> {
    return ["안동 김씨", "전주 이씨", "김해 김씨", "안동 권씨"];
  }
}

/** Prisma/SQLite 기반 저장소. 실제 운영 경로 (DB 시드 후 사용) */
class PrismaDataRepository extends BaseClanRepository {
  readonly isDemoData = false;

  private rowsPromise: Promise<ExamRecordRow[]> | null = null;
  private summariesPromise: Promise<ClanSummary[]> | null = null;
  private clanNameMap = new Map<string, string>();

  private async fetchExamRows(): Promise<ExamRecordRow[]> {
    const exams = await prisma.exam.findMany({ include: { person: true } });
    const rows: ExamRecordRow[] = exams.map((exam) => {
      const king = getKing(exam.kingId);
      const person = exam.person;
      return {
        id: exam.id,
        personId: person.id,
        personName: person.name,
        surname: person.surname,
        bonGwan: person.bonGwan,
        clanId: person.clanId,
        clanName: clanDisplayName(person.bonGwan, person.surname),
        type: exam.type,
        year: exam.year,
        kingId: exam.kingId,
        kingName: king?.name ?? exam.kingId,
        reignYear: reignYear(exam.kingId, exam.year),
        grade: exam.grade,
        residence: person.residence,
      };
    });
    rows.sort(
      (a, b) =>
        b.year - a.year || a.personName.localeCompare(b.personName, "ko"),
    );
    this.clanNameMap.clear();
    for (const r of rows) this.clanNameMap.set(r.clanId, r.clanName);
    return rows;
  }

  protected loadRows(): Promise<ExamRecordRow[]> {
    if (!this.rowsPromise) {
      this.rowsPromise = this.fetchExamRows().catch((err: unknown) => {
        this.rowsPromise = null;
        this.clanNameMap.clear();
        throw err;
      });
    }
    return this.rowsPromise;
  }

  protected override async loadSummaries(): Promise<ClanSummary[]> {
    if (!this.summariesPromise) {
      this.summariesPromise = this.loadRows()
        .then(buildClanSummaries)
        .catch((err: unknown) => {
          this.summariesPromise = null;
          throw err;
        });
    }
    return this.summariesPromise;
  }

  protected resolveClanName(clanId: string): string {
    return this.clanNameMap.get(clanId) ?? clanId;
  }

  async getPerson(id: string): Promise<PersonDetail | null> {
    const person = await prisma.person.findUnique({ where: { id } });
    if (!person) return null;

    const rows = await this.loadRows();
    const exams = rows.filter((r) => r.personId === id);

    const relationRows = await prisma.personRelation.findMany({
      where: { OR: [{ personId: id }, { relatedPersonId: id }] },
      include: { person: true, related: true },
    });

    const relations: RelationInfo[] = [];
    const relatedBy: RelationInfo[] = [];
    const seenPairs = new Set<string>();
    for (const r of relationRows) {
      const pairKey = [r.personId, r.relatedPersonId].sort().join("|");
      if (seenPairs.has(pairKey)) continue;
      seenPairs.add(pairKey);
      const target = r.personId === id ? r.related : r.person;
      const isForward = r.personId === id;
      const info: RelationInfo = {
        personId: target.id,
        personName: target.name,
        clanName: clanDisplayName(target.bonGwan, target.surname),
        type: r.type,
        relationLabel: relationLabel(
          isForward ? r.type : invertRelationType(r.type),
        ),
      };
      (isForward ? relations : relatedBy).push(info);
    }

    return {
      id: person.id,
      name: person.name,
      surname: person.surname,
      bonGwan: person.bonGwan,
      clanId: person.clanId,
      clanName: clanDisplayName(person.bonGwan, person.surname),
      residence: person.residence,
      birthYear: person.birthYear ?? undefined,
      deathYear: person.deathYear ?? undefined,
      exams,
      relations,
      relatedBy,
    };
  }

  async popularSearches(): Promise<string[]> {
    return rankByColumn(await this.loadSummaries(), "total")
      .slice(0, 6)
      .map((c) => c.name);
  }
}

let instance: DataRepository | null = null;

/**
 * 앱 전역에서 사용하는 저장소 인스턴스.
 * 기본은 DB(PrismaDataRepository)이고, DATA_SOURCE=mock이면 메모리 mock을 쓴다.
 * (DB 시드 없이 개발 서버를 띄우고 싶을 때 사용)
 */
export function getRepository(): DataRepository {
  if (!instance) {
    instance =
      process.env.DATA_SOURCE === "mock"
        ? new MockDataRepository()
        : new PrismaDataRepository();
  }
  return instance;
}

export const repository = getRepository();
