# 과거탐색기 — Gwageo Explorer

<p align="center">
  <a href="https://github.com/spear34000/Gwageo_Explorer">
    <img src="https://img.shields.io/badge/Next.js-16.3-black?logo=next.js" alt="Next.js"/>
  </a>
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react" alt="React"/>
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/Prisma-7.9-2D3748?logo=prisma" alt="Prisma"/>
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss" alt="Tailwind"/>
  <img src="https://img.shields.io/badge/license-MIT-green" alt="License"/>
  <img src="https://img.shields.io/badge/data-AKS-0e4d7a" alt="Data"/>
</p>

<p align="center">
  조선시대 <b>과거시험 합격 기록 84,525건</b>을 본관 · 인물 · 왕대 기준으로 탐색하는 웹앱<br/>
  <sub>한국학중앙연구원 한국역대인물종합정보시스템 실데이터 기반 · 2,976 본관 · 69,181 인물 · 42,324 가족관계</sub>
</p>

<p align="center">
  <a href="#시작하기">시작하기</a> ·
  <a href="#주요-기능">주요 기능</a> ·
  <a href="#데이터">데이터</a> ·
  <a href="#ai-본관-리뷰">AI 리뷰</a> ·
  <a href="#본관별-유명-인물">유명 인물</a>
</p>

---

## 스크린샷

> `public/screenshots/`에 실제 캡처를 넣으면 아래 이미지가 표시됩니다. 현재는 플레이스홀더입니다.

| 홈 · 검색 | 본관 상세 | 인물 관계 |
|---|---|---|
| <img src="https://via.placeholder.com/360x220/0e4d7a/ffffff?text=Home+%7C+%EA%B2%80%EC%83%89" alt="home" width="360"/> | <img src="https://via.placeholder.com/360x220/0e4d7a/ffffff?text=Clan+Detail" alt="clan" width="360"/> | <img src="https://via.placeholder.com/360x220/0e4d7a/ffffff?text=Person" alt="person" width="360"/> |

---

## 주요 기능

- **본관 탐색** — 합격자 집계/순위, 시험 유형 분포, 전성기 왕, 주요 거주지. 한글 검색(정확 일치 우선)
- **인물 상세** — 합격 기록 + 가족관계(부/형제/조부 등 양방향, 중복 제거)
- **왕대별 랭킹** — 특정 왕대(예: 영조)에서 두각을 보인 본관 순위
- **본관 비교** — 두 본관을 나란히 비교(전성기 왕, 주 거주지)
- **랭킹 TOP 100** — 전체/문과/무과/생원/진사 정렬
- **AI 본관 리뷰** — 본관 집계를 재료로 한 유머 요약(병맛/수다/다큐병/중계 4톤 랜덤)
- **유명 인물** — Wikidata(CC0) 기반 본관별 유명 인물
- **다크모드** — 헤더 토글 + `localStorage` + `prefers-color-scheme` + 플래시 방지
- **포스터 저장** — 본관 포스터를 512×512 이미지로 다운로드

---

## 기술 스택

| 영역 | 스택 |
|---|---|
| 프레임워크 | Next.js 16.3 App Router (`src/`), React 19 |
| 언어/스타일 | TypeScript strict, Tailwind CSS 4 |
| 데이터 | Prisma 7.9 + SQLite (`better-sqlite3` adapter), `generated/prisma` (`@db/*` alias) |
| 실데이터 | 한국학중앙연구원 AKS 과거·취재 데이터 가공 (`prisma/real-data.json`) |
| AI | NVIDIA NIM OpenAI 호환 (`nvidia/nemotron-3-nano-30b-a3b` 등) |

### 특이사항

- **Next 16.3 동적 라우트 `params`/`searchParams`는 Promise** — `await` 필수
- **본 버전은 `params`를 URL 디코딩하지 않음** — `decodeURIComponent(id)` 필요 (`src/app/clans/[id]/page.tsx`)
- **본관 집계는 비용이 큼** — `PrismaDataRepository`의 `rowsPromise`/`summariesPromise` 캐시 재사용
- **관계는 양방향 저장** — `RELATION_LABELS` + `INVERSE_RELATION`으로 라벨 반전

---

## 시작하기

```bash
npm install

# DB 스키마 생성 + 시드 (최초 1회, 재실행 시 동일 결과)
npm run db:push
npm run db:seed          # 69,181 인물 / 84,525 합격 / 42,324 관계
npm run db:seed:notables # Wikidata 유명 인물 230건 (선택)

# 개발 서버 (http://localhost:3000)
npm run dev

# 프로덕션 빌드
npm run build -- --webpack   # Turbopack은 .omo/codegraph 이슈로 패닉 → webpack 사용
npm run start
```

`DATA_SOURCE=mock`이면 DB 없이 메모리 mock으로 동작합니다:

```bash
DATA_SOURCE=mock npm run dev
```

---

## 스크립트

| 스크립트 | 내용 |
|---|---|
| `npm run dev` | 개발 서버 |
| `npm run build` | 프로덕션 빌드 (SQLite 쿼리 포함 정적 생성) |
| `npm run start` | 프로덕션 서버 |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:push` | `prisma db push` |
| `npm run db:seed` | `prisma db seed` (tsx `prisma/seed.ts`) |
| `npm run db:seed:notables` | Wikidata에서 본관별 유명 인물 수집 후 적재 |

---

## AI 본관 리뷰

본관 상세 상단에서 NVIDIA NIM(OpenAI 호환)이 집계 데이터를 재료로 유머 요약을 생성합니다. 4가지 톤(병맛/수다/다큐병/중계)이 랜덤 적용되며 **새 요약** 버튼으로 다시 생성할 수 있습니다. AI 문구는 재미용이며 사실 확인용이 아닙니다.

```bash
# .env (gitignore) — 키 없으면 AI 카드에 오류 문구만 표시
NVIDIA_API_KEY=nvapi-...
NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1
NVIDIA_MODEL=nvidia/nemotron-3-nano-30b-a3b
```

---

## 본관별 유명 인물

클랜 상세 페이지에 Wikidata(CC0) 기반 유명 인물을 노출합니다.

- SPARQL: `P53(가문)` → `Q846706(본관)` 으로 연결된 한국 인물을 수집
- 매핑: `경주 김씨` → `경주-김` (`씨` 제거 + 공백→하이픈)
- 적재: `npm run db:seed:notables` (예: 230건)

> 파(분파) 단위까지 확장하려면 `branchId` 필드와 별도 파 데이터 소스가 필요합니다. 현재는 본관 단위이며, 파 확장은 `가문정보(분파/항렬)`가 있는 `gok.kr` 또는 위키백과 파 목록을 소스로 추가할 수 있습니다.

---

## 데이터

- **스키마:** `prisma/schema.prisma` (`Person`, `Exam`, `PersonRelation`, `ClanNotable`)
- **시드:** `prisma/seed.ts` — `prisma/real-data.json`을 SQLite에 적재
- **수집:** `scripts/ingest-real-data.mjs` — 원본 XLSX(문과/무과/생원/진사/친속)를 정규화(본관·이름 병합, 연도/왕/등급 파생)하여 `prisma/real-data.json` 생성
- **등급:** 원자료에 등급 필드가 없어 연도별 순번으로 근사(갑과 1–3 / 을과 4–10 / 병과 11~)
- **DB 파일:** `prisma/dev.db` (gitignore)

데이터 접근은 `src/lib/data/repository.ts`의 `DataRepository` 인터페이스로 단일화되어 있습니다. 기본은 SQLite(`PrismaDataRepository`), `DATA_SOURCE=mock`이면 메모리 mock으로 동작합니다.

---

## 프로젝트 구조

```
src/app/                  라우트 (서버 컴포넌트)
  /                       홈: 검색 + TOP 10 미리보기
  /clans, /clans/[id]     본관 목록·검색·상세
  /people/[id]            인물 상세 (합격 기록 + 관계)
  /rankings               본관 랭킹 TOP 100
  /periods, /periods/[king]  왕대별 목록·순위
  /compare                본관 비교
  /exams, /about/data     시험 종류·데이터 소개
  /api/search             한글 검색 API (JSON)
  /api/ai-summary         AI 요약 API
src/components/           표·차트·탭·검색 등
src/lib/data/             repository, types, mock-data, clan-roster, kings, db
prisma/                   schema, seed, real-data.json
generated/prisma/         Prisma Client (@db/* alias)
scripts/                  ingest / seed-notables
```

---

## 디자인 원칙

- 단일 강조색 `#0e4d7a`(딥 아카이브 블루), gradient/glow/둥근 카드/그림자 금지
- 표·목록·타임라인 중심의 정보 밀도 높은 레이아웃
- 데모 데이터일 때 상단에 데모 배너 자동 노출
- 자세한 컴포넌트/API 계약은 `.omo/component-contract.md` 참고

---

## 기여

이슈와 PR을 환영합니다. 커밋 전 `npm run typecheck && npm run lint`를 통과시켜 주세요.

---

## 라이선스

MIT — `LICENSE` 참고. 데이터는 한국학중앙연구원 AKS 출처를 표기하여 사용하세요.

---

<p align="center"><sub>Made with Next.js · Prisma · Wikidata CC0</sub></p>
