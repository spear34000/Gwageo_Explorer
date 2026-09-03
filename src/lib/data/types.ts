/**
 * 과거탐색기 데이터 모델
 *
 * 모든 타입은 한국학중앙연구원 한국역대인물종합정보시스템의
 * 과거·취재 데이터(1차 후보)와 1:1로 대응하도록 설계했다.
 * ingestion layer가 실제 데이터로 교체되어도 UI/비즈니스 로직은
 * DataRepository 인터페이스만 바라보므로 변경이 필요 없다.
 */

/** 시험 종류 */
export type ExamType = "mun" | "mu" | "saengwon" | "jinsa";

export const EXAM_TYPE_LABELS: Record<ExamType, string> = {
  mun: "문과",
  mu: "무과",
  saengwon: "생원",
  jinsa: "진사",
};

export const EXAM_TYPE_ORDER: ExamType[] = ["mun", "mu", "saengwon", "jinsa"];

/** 표 정렬 기준으로 쓰는 합격 유형 */
export type ExamColumn = "total" | ExamType;

export const EXAM_COLUMN_LABELS: Record<ExamColumn, string> = {
  total: "전체",
  mun: "문과",
  mu: "무과",
  saengwon: "생원",
  jinsa: "진사",
};

/** 왕 / 재위 기간 */
export interface King {
  id: string; // "yeongjo"
  name: string; // "영조"
  reignStart: number; // 재위 시작 연도
  reignEnd: number; // 재위 마지막 연도 (포함)
}

/** 본관 원본 기록 (seed) */
export interface ClanSeed {
  id: string; // "andong-kim"
  surname: string; // "김"
  bonGwan: string; // "안동"
  /** 본관 이름 (ex. "안동 김씨") - id와 항상 일치해야 한다 */
  name: string;
  /** 주요 거주지 후보 (거주지 생성 시 우선 사용) */
  mainResidence: string;
  /** 상대적 규모 가중치 (데이터 생성 시 전체 합격자 수를 결정) */
  weight: number;
}

/** 인물 원본 기록 (seed) */
export interface PersonSeed {
  id: string;
  name: string;
  surname: string;
  bonGwan: string;
  clanId: string;
  residence: string;
  birthYear?: number;
  deathYear?: number;
}

/** 과거 합격 기록 (seed) - 인물 1명이 여러 건을 가질 수 있다 */
export interface ExamSeed {
  id: string;
  personId: string;
  type: ExamType;
  year: number;
  kingId: string;
  /** 합격 등급/순위 라벨 (ex. "갑과 1위", "을과", "1등") */
  grade: string;
}

/** 인물 관계 기록 (seed) - 원본 데이터에 존재하는 관계만 기록한다 */
export interface RelationSeed {
  personId: string;
  relatedPersonId: string;
  /** 관계 유형: "father" | "son" | "brother" ... */
  type: string;
}

/**
 * 본관 집계 요약 (순위표, 검색 결과에 사용)
 */
export interface ClanSummary {
  id: string;
  surname: string;
  bonGwan: string;
  name: string; // "안동 김씨"
  total: number;
  mun: number;
  mu: number;
  saengwon: number;
  jinsa: number;
  /** 전체 합격자 기준 순위 (1부터) */
  rank: number;
}

/** 왕대별 합격자 수 */
export interface KingCount {
  kingId: string;
  kingName: string;
  count: number;
}

/** 시험 종류별 합격자 수/비율 */
export interface ExamTypeStat {
  type: ExamType;
  count: number;
  /** 0~1 비율 */
  ratio: number;
}

/** 본관 상세 (상세 페이지에 사용) */
export interface ClanDetail extends ClanSummary {
  byKing: KingCount[];
  examTypeStats: ExamTypeStat[];
  residences: { residence: string; count: number }[];
  /** 합격자가 가장 많이 나온 왕 */
  peakKing: KingCount;
  /** 가장 흔한 거주지 */
  mainResidence: string;
}

export type ClanResearchStatus =
  | "verified"
  | "ambiguous"
  | "no_official_source"
  | "outside_korea"
  | "review_required"
  | "license_blocked";

export interface ClanLocationEvidence {
  id: string;
  provider: string;
  title: string;
  url: string;
  licenseCode: string;
  licenseUrl: string;
  evidenceSummary: string;
}

export interface ClanLocation {
  id: string;
  clanId: string;
  kind: "origin" | "administrative" | "settlement";
  name: string;
  modernArea: string;
  latitude: number;
  longitude: number;
  status: ClanResearchStatus;
  note?: string;
  evidence: ClanLocationEvidence[];
}

/** 합격 기록 행 (합격자 목록 테이블에 사용) */
export interface ExamRecordRow {
  id: string; // exam id
  personId: string;
  personName: string;
  surname: string;
  bonGwan: string;
  clanId: string;
  clanName: string;
  type: ExamType;
  year: number;
  kingId: string;
  kingName: string;
  /** 재위 연수 (ex. "12") */
  reignYear: number;
  grade: string;
  residence: string;
}

/** 관계 표시용 인물 */
export interface RelationInfo {
  personId: string;
  personName: string;
  clanName: string;
  /** 관계 유형 키 ("father" 등) */
  type: string;
  /** 한글 관계 라벨 ("아버지" 등) */
  relationLabel: string;
}

/** 인물 상세 */
export interface PersonDetail {
  id: string;
  name: string;
  surname: string;
  bonGwan: string;
  clanId: string;
  clanName: string;
  residence: string;
  birthYear?: number;
  deathYear?: number;
  exams: ExamRecordRow[];
  /** 이 인물이 걸린 관계 (ex. 아버지) */
  relations: RelationInfo[];
  /** 이 인물을 가리키는 관계 (ex. 아들, 형제) */
  relatedBy: RelationInfo[];
}

/** 왕대 정보 + 해당 시기 합격자 총수 */
export interface KingInfo {
  king: King;
  total: number;
}

/** 왕대별 본관 순위 항목 */
export interface PeriodClanRank {
  clanId: string;
  clanName: string;
  count: number;
}

/** 본관 비교 결과 */
export interface ClanComparison {
  a: ClanSummary;
  b: ClanSummary;
  peakKings: { a: string; b: string };
  mainResidences: { a: string; b: string };
}

/** 검색 결과 항목 */
export interface ClanSearchResult {
  clan: ClanSummary;
  /** 낮을수록 정확한 매칭 (0 = exact) */
  score: number;
  /** 매칭 방식 설명 ("정확히 일치", "성씨 일치" 등) */
  matchLabel: string;
}

/**
 * 데이터 저장소 인터페이스.
 *
 * 현재 구현은 Prisma/SQLite 기반(PrismaDataRepository)이고,
 * DB가 없거나 DATA_SOURCE=mock이면 메모리 mock(MockDataRepository)으로 동작한다.
 * 모든 조회는 비동기다. UI(서버 컴포넌트/라우트 핸들러)는 이 인터페이스에만 의존한다.
 */
export interface DataRepository {
  /** 개발용 샘플 데이터 여부. true면 화면에 데모 배너를 노출해야 한다 */
  readonly isDemoData: boolean;
  /** 모든 본관 집계 (전체 합격자 순위 기준) */
  listClans(): Promise<ClanSummary[]>;
  /** 본관 상세. 없으면 null */
  getClan(id: string): Promise<ClanDetail | null>;
  /** Publicly displayable, evidence-backed locations for a clan */
  getClanLocations(id: string): Promise<ClanLocation[]>;
  /** 기준 컬럼으로 정렬한 본관 순위 */
  clanRanking(sortBy: ExamColumn): Promise<ClanSummary[]>;
  /** 한글 검색 (정규화 + exact match 우선) */
  searchClans(query: string): Promise<ClanSearchResult[]>;
  /**
   * 합격 기록 목록 (필터 + 페이지네이션)
   * page는 1부터 시작
   */
  listExamRecords(
    filters: { clanId?: string; examType?: ExamType; kingId?: string },
    page: number,
    pageSize: number,
  ): Promise<{ items: ExamRecordRow[]; total: number }>;
  /** 인물 상세. 없으면 null */
  getPerson(id: string): Promise<PersonDetail | null>;
  /** 왕 목록 + 왕대별 합격자 총수 (재위 연순) */
  listKings(): Promise<KingInfo[]>;
  /** 특정 왕대의 본관 순위 (합격자 수 내림차순) */
  periodRanking(kingId: string): Promise<PeriodClanRank[]>;
  /** 상위 본관 (기준 컬럼, limit개) */
  topClans(examColumn: ExamColumn, limit: number): Promise<ClanSummary[]>;
  /** 본관 비교. id가 유효하지 않으면 null */
  getComparison(aId: string, bId: string): Promise<ClanComparison | null>;
  /** 인기 검색어 예시 */
  popularSearches(): Promise<string[]>;
}
