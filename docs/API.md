# API

## 내부 API (Route Handlers)

### `GET /api/search`

한글 본관 검색 API. `q` 파라미터로 검색어를 받습니다.

**Request:**
```
GET /api/search?q=안동김씨
GET /api/search?q=김해
GET /api/search?q=ㄱㅎ          # 초성
GET /api/search?q=金海          # 한자
```

**Response:** `200 application/json`
```json
[
  {
    "id": "안동-김",
    "name": "안동 김씨",
    "total": 1320,
    "rank": 9,
    "score": 0,
    "matchLabel": "정확히 일치"
  },
  {
    "id": "김해-김",
    "name": "김해 김씨",
    "total": 2043,
    "rank": 3,
    "score": 3,
    "matchLabel": "성씨 일치"
  }
]
```

- `score`: 0=정확, 1=본관·성씨, 2=본관, 3=성씨, 4=부분, 5=초성, 6=한자, 7=유사
- 정렬: `score` 오름차순, 동점 시 `total` 내림차순
- 빈 쿼리 시 `[]`

**구현:** `src/app/api/search/route.ts` → `repository.searchClans(q)`

---

### `POST /api/ai-summary`

본관 AI 요약 (스트리밍). `clanId`, `clanName`, `rank`, `stats`, `peakKing` 등을 받아 NVIDIA NIM으로 유머 요약을 생성합니다.

**Request:** `POST application/json`
```json
{
  "clanId": "전주-이",
  "clanName": "전주 이씨",
  "rank": 1,
  "stats": { "total": 5316, "mun": 870, "mu": 1410, "saengwon": 1389, "jinsa": 1647 },
  "peakKing": { "kingId": "yeongjo", "kingName": "영조", "count": 412 },
  "mainResidence": "한성",
  "tone": "병맛" // 병맛 | 수다 | 다큐병 | 중계 (선택, 없으면 랜덤)
}
```

**Response:** `text/event-stream` (SSE)
```
data: {"delta": "전주 이씨, "}
data: {"delta": "듣자마자 "}
...
data: {"done": true}
```

- 모델: `nvidia/nemotron-3-nano-30b-a3b` (기본), `chat_template_kwargs: {thinking: false}`, `max_tokens: 1024`, `timeout: 30s`
- 키 없으면 `AIClanSummary`에서 오류 문구 표시 (폴백)
- 4가지 톤 중 랜덤, `새 요약` 버튼으로 재요청 가능

**구현:** `src/app/api/ai-summary/route.ts`

---

## DataRepository (내부 인터페이스)

UI(서버 컴포넌트/Route Handler)는 `DataRepository`에만 의존합니다. 직접 Prisma를 호출하지 않습니다.

```ts
// src/lib/data/types.ts
interface DataRepository {
  listClans(): Promise<ClanSummary[]>
  getClan(id: string): Promise<ClanDetail | null>
  clanRanking(sortBy: ExamColumn): Promise<ClanSummary[]>
  searchClans(query: string): Promise<ClanSearchResult[]>
  listExamRecords(filters, page, pageSize): Promise<{items: ExamRecordRow[], total: number}>
  getPerson(id: string): Promise<PersonDetail | null>
  listKings(): Promise<KingInfo[]>
  periodRanking(kingId: string): Promise<PeriodClanRank[]>
  topClans(column: ExamColumn, limit: number): Promise<ClanSummary[]>
  getComparison(aId: string, bId: string): Promise<ClanComparison | null>
  popularSearches(): Promise<string[]>
}
```

| 메서드 | 설명 | 사용처 |
|---|---|---|
| `listClans` | 전체 본관 집계 (순위) | `/clans`, `/` (TOP 10) |
| `getClan` | 본관 상세 (byKing, residences 등) | `/clans/[id]` |
| `searchClans` | 한글 검색 (정규화 + 스코어) | `/api/search`, `/clans?q=` |
| `listExamRecords` | 합격 기록 페이지네이션 | `/clans/[id]`, `/compare` |
| `getPerson` | 인물 상세 + 관계 | `/people/[id]` |
| `listKings` | 왕 목록 + 합격자 수 | `/periods` |
| `periodRanking` | 특정 왕대의 본관 순위 | `/periods/[king]` |

---

## 외부 API (사용하지 않음)

현재 외부 API를 직접 호출하지 않습니다. AI 요약만 NVIDIA NIM을 Route Handler에서 호출합니다.

- **Wikidata**는 이전 유명인 기능에서 `P53` SPARQL로 사용했으나 현재 제거됨. 필요 시 `scripts/seed-notables.ts` 참조.
- **AKS** 원본 XLSX는 빌드 타임에만 사용, 런타임 호출 없음.

---

## 타입

주요 타입은 `src/lib/data/types.ts`에 정의:

- `ClanSummary` — `id, surname, bonGwan, name, total, mun, mu, saengwon, jinsa, rank`
- `ClanDetail` — `ClanSummary` + `byKing, examTypeStats, residences, peakKing, mainResidence`
- `ExamRecordRow` — `id, personId, personName, surname, bonGwan, clanId, clanName, type, year, kingId, kingName, reignYear, grade, residence`
- `PersonDetail` — `id, name, surname, bonGwan, clanId, clanName, residence, birthYear, deathYear, exams, relations, relatedBy`
- `ClanSearchResult` — `clan, score, matchLabel`
