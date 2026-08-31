# 컴포넌트

## 디자인 원칙

- 단일 강조색 `#0e4d7a` (딥 아카이브 블루)
- `globals.css` 토큰 + `data-table`/`bar-row` 등 시멘틱 클래스
- `gradient`, `glow`, `glassmorphism`, 둥근 카드, 그림자 금지
- 표·목록·타임라인 중심, 정보 밀도 높게

자세한 계약은 `.omo/component-contract.md` 참고.

## 레이아웃

### `Header.tsx`

- 좌: 로고 `과거탐색기` (`/`)
- 중: 네비 (`본관 검색`, `본관 순위`, `왕대별`, `과거시험`, `데이터 소개`)
- 우: `ThemeToggle` (다크모드, `useSyncExternalStore`)

### `Footer.tsx`, `DemoBanner.tsx`

- `DemoBanner`는 `repository.isDemoData`가 `true`일 때만 노출 (`DATA_SOURCE=mock`).

## 본관 상세

### `ClanDetailClient.tsx` (Client)

본관 상세 페이지의 클라이언트 래퍼. 서버 컴포넌트 `clans/[id]/page.tsx`에서 `ClanDetail` + `ExamRecordRow[]`를 받아 시각화합니다.

```
AIClanSummary
  ↓
KoreaMap (300px) + ClanSummary (grid)
  ↓
PeriodTimeline (히트맵 + 라인/영역 or 세로막대)
  ↓
ExamTypeTabs
  ↓
PersonTable + Pagination
  ↓
Residences (table + bar)
```

- `useEffect` + `animejs`로 `[data-animate=fade]`, `.bar-row`, `.data-table tbody tr`, `.korea-dot`, `.pt-*` 등을 스태거 애니메이션.
- `clanId` 변경 시 애니메이션 재실행.

### `KoreaMap.tsx` (Client)

한반도 위성 지도. `residences` 상위 5곳과 `bonGwan`을 표시합니다.

- 배경: NASA Blue Marble 위성 이미지 (`Wikimedia Commons` 경유, `clipPath`로 한반도 클리핑)
- 좌표: `PLACE_COORDS` 수동 매핑 (40여 개 주요 지명, `한양: [48,32]` 등). `normalizePlace`로 `()` 제거 후 매칭, 없으면 앞 2글자로 fallback.
- 마커: `bonGwan`은 흰 바탕+네이비 테두리 별, `mainResidence`는 진하게, 나머지는 옅게. `korea-dot` 클래스로 `scale 0→1` 팝인.
- 범례: `● 본관 {bonGwan} · ○ 거주지`

### `PeriodTimeline.tsx` (Client)

시대별 합격자 추이. `data: {label, value}[]` (27개 왕대)와 `max`를 받습니다.

- **현재:** 세로 막대 (`h-[180px]`, `scaleY 0→1`, `outExpo`, 32ms 스태거)
- **이전 버전:** 산맥형(Catmull 곡선), 라인/영역, 눕힌 막대, 점 타임라인 등 — `git log`에서 확인 가능
- `peak`는 `bg-accent`로 강조

### `ClanSummary.tsx`

본관 요약 카드 (순위, 총합, 시험 유형별 수, 전성기 왕, 주 거주지).

### `AIClanSummary.tsx` (Client)

AI 요약 카드. `clanId`, `clanName`, `rank`, `stats`를 받아 `/api/ai-summary`를 스트리밍 호출합니다.

- 4가지 톤 중 랜덤, `새 요약` 버튼으로 재요청
- 키 없으면 오류 문구, 로딩 시 스켈레톤

### `ExamTypeTabs.tsx`

시험 종류 탭 (`전체`, `문과`, `무과`, `생원`, `진사`). `active`와 `baseHref`로 링크를 생성합니다.

## 목록/표

### `PersonTable.tsx`

합격자 목록 테이블. `rows: ExamRecordRow[]`를 받아 `이름`, `시험`, `연도(재위 연차)`, `등급`, `거주지`를 표시합니다. 이름은 `/people/[id]`로 링크.

### `RankingTable.tsx`

본관 랭킹 테이블. `clans: ClanSummary[]`와 `sortBy`로 정렬된 TOP 100을 표시합니다.

### `Pagination.tsx`

페이지네이션. `page`, `totalPages`, `baseHref`로 `?page=` 링크를 생성합니다.

## 입력

### `SearchBar.tsx` (Client)

검색 입력. `q` 파라미터로 `/clans`로 이동합니다. `popularSearches`와 연동.

### `ThemeToggle.tsx` (Client)

다크모드 토글. `useSyncExternalStore`로 `localStorage` + `prefers-color-scheme`를 구독합니다. `document.documentElement.classList`를 직접 조작합니다.

## 유틸

### `PeriodTimeline` vs `KoreaMap` vs `SearchBar`

- `PeriodTimeline`과 `KoreaMap`은 `animejs`를 `useEffect`에서 직접 호출합니다. `delay`의 타입 불일치는 `// @ts-ignore` + `as any`로 우회합니다.
- `SearchBar`는 폼 제출 시 `router.push` 없이 `action="/clans"`로 네비게이션합니다 (서버 컴포넌트 친화).

## 접근성

- `PeriodTimeline`의 `bar-track`은 `role="img"` + `aria-label="영조 67명"`
- `KoreaMap`의 `svg`는 `role="img"` + `aria-label="한반도 거주지 분포"`, 각 마커는 `title`로 `왕명 n명`
- 테이블은 `caption class="sr-only"`로 스크린 리더 대응
