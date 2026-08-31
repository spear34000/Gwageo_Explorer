# 아키텍처 (Architecture)

## 개요

과거탐색기는 **Next.js 16.3 App Router** 기반의 서버 컴포넌트 중심 아키텍처를 채택합니다. 모든 데이터 접근은 `DataRepository` 인터페이스로 추상화되어, UI는 SQLite(`PrismaDataRepository`)와 메모리 목(`MockDataRepository`)을 구분하지 않고 동일한 비동기 API로 동작합니다.

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────┐
│  Server         │────▶│  DataRepository  │────▶│  Prisma     │
│  Components     │     │  (interface)     │     │  + SQLite   │
│  / Route        │     │                  │     │  dev.db     │
│  Handlers       │     └──────────────────┘     └─────────────┘
└─────────────────┘              │                      │
                                 └──── Mock ────────────┘
                                       (DATA_SOURCE=mock)
```

## 디렉터리 구조

```
src/
  app/                    # App Router 라우트 (서버 컴포넌트)
    layout.tsx            # RootLayout + Theme script + DemoBanner
    page.tsx              # 홈: 검색 + TOP 10
    globals.css           # Tailwind 4 + 디자인 토큰
    clans/                # 본관 목록/상세
    people/[id]/          # 인물 상세
    rankings/             # TOP 100
    periods/              # 왕대별
    compare/              # 본관 비교
    api/search/           # 한글 검색 API
    api/ai-summary/       # AI 요약 API
  components/             # 재사용 컴포넌트 (Client/Server 혼합)
    KoreaMap.tsx          # 한반도 위성 지도 (Wikimedia NASA)
    PeriodTimeline.tsx    # 시대별 라인/영역 차트 (anime.js)
    ClanDetailClient.tsx  # 본관 상세 클라이언트 래퍼
    AIClanSummary.tsx     # AI 요약 카드
    SearchBar.tsx         # 검색 입력
    ...
  lib/
    data/
      repository.ts       # DataRepository 구현 (Prisma/Mock)
      types.ts            # 도메인 타입 (ClanSummary, PersonDetail 등)
      kings.ts            # 27대 왕 목록 + 재위 기간
      db.ts               # PrismaClient 싱글톤
      mock-data.ts        # 목업 시드
      clan-roster.ts      # 목업 클랜 로스터
    search.ts             # 한글 검색 정규화 + 초성/한자/오타
    format.ts             # 숫자 포맷
  hooks/
    useAIStream.ts        # AI 스트리밍 훅

prisma/
  schema.prisma           # Person, Exam, PersonRelation
  seed.ts                 # real-data.json → SQLite
  real-data.json          # 22MB, 84k 합격 / 69k 인물 (커밋 대상)

generated/prisma/         # Prisma Client (@db/* alias, gitignore)
scripts/
  ingest-real-data.mjs    # AKS XLSX → real-data.json
```

## 데이터 흐름

### 1. 빌드 타임

```
XLSX (aks-data/*.xlsx, 7개, gitignore) 
  → scripts/ingest-real-data.mjs 
  → prisma/real-data.json (커밋) 
  → prisma/seed.ts 
  → prisma/dev.db (SQLite, gitignore)
```

- `ingest-real-data.mjs`는 `문과/무과/생원/진사` 4종 + `친속` 3종을 정규화합니다.
- `clanId`는 `${bonGwan}-${surname}` 형태의 한글 슬러그입니다 (예: `전주-이`).
- 등급은 원자료에 없어 `연도별 순번`으로 파생합니다 (갑과 1-3 / 을과 4-10 / 병과 11~).

### 2. 런타임

```
page.tsx (server) 
  → repository.getClan(id)  // async
  → PrismaDataRepository.loadRows() // cached rowsPromise
  → buildClanDetail()       // 집계 (byKing, residences, peakKing)
  → ClanDetailClient (client) // 시각화 + 인터랙션
```

- `PrismaDataRepository`는 `rowsPromise`/`summariesPromise`로 84k 행 집계를 캐시합니다. 재계산 금지.
- `MockDataRepository`는 `DATA_SOURCE=mock`일 때 동일 인터페이스로 동작합니다 (개발/테스트용).

### 3. AI 요약

```
ClanDetailClient
  → AIClanSummary (client)
  → POST /api/ai-summary { clanName, rank, stats, king, residence }
  → NVIDIA NIM (OpenAI 호환, nemotron-3-nano-30b-a3b)
  → stream (SSE)
```

- 4가지 톤(병맛/수다/다큐병/중계) 중 랜덤, `새 요약`으로 재요청 가능.
- `max_tokens: 1024`, `timeout: 30s`, `thinking: false`로 최적화 (이전 45s → 1.8s).

## 렌더링 전략

| 라우트 | 렌더링 | 이유 |
|---|---|---|
| `/` | Static + ISR | TOP 10은 빌드 시 쿼리 |
| `/clans/[id]` | Dynamic (SSR) | `decodeURIComponent(id)` 필요, `searchParams` Promise |
| `/people/[id]` | Dynamic | 관계 그래프 |
| `/rankings` | Static | TOP 100 |
| `/api/*` | Dynamic | 검색/AI |

- **Next 16.3 특이사항:** `params`/`searchParams`는 Promise이며, URL 디코딩을 하지 않습니다. `clans/[id]`에서 한글 슬러그(`전주-이`)는 `decodeURIComponent` 후 조회해야 합니다.
- **Turbopack 이슈:** `.omo/codegraph` 경로 버그로 `next build` 시 Turbopack이 패닉 → `next build --webpack` 필수.

## 상태 관리

- **서버 상태:** `DataRepository` (캐시된 Promise)
- **클라이언트 상태:** `useState`/`useEffect` + `useSyncExternalStore` (ThemeToggle)
- **URL 상태:** `searchParams` (exam 필터, page, q)

전역 상태 라이브러리(Redux/Zustand) 없음 — 서버 컴포넌트와 URL로 충분합니다.

## 테마

- `globals.css`에 CSS 변수 (`--bg`, `--fg`, `--accent` 등) 정의
- `:root` (라이트) + `.dark` 오버라이드로 다크모드
- `ThemeToggle.tsx`는 `useSyncExternalStore`로 `localStorage` + `prefers-color-scheme` 동기화
- `layout.tsx`에 FOUC 방지 인라인 스크립트 + `suppressHydrationWarning`

## 보안

- `DATABASE_URL` 없음 — SQLite 파일 직접 참조 (`file:./prisma/dev.db`)
- `NVIDIA_API_KEY`는 `.env` (gitignore), 클라이언트에 노출되지 않음 (Route Handler에서만 사용)
- `allowedDevOrigins: ["127.0.0.1"]` — HMR 크로스 오리진 허용

## 확장 포인트

- **파(분파) 확장:** `Person`에 `branchId` 추가, `ClanBranch` 테이블 신설, `gok.kr`/`위키백과` 크롤러로 `branch` 데이터 적재
- **유명 인물 재도입:** `ClanNotable` 모델 + `P53` SPARQL + `scripts/seed-notables.ts` (이전 구현 참조, CC0)
- **지도 고도화:** `KoreaMap`의 `PLACE_COORDS`를 KOSIS 좌표로 교체, Leaflet 도입 검토
