# 과거탐색기

조선시대 과거시험(문과/무과/생원/진사) 합격 데이터를 본관·인물·왕대 기준으로 탐색하는 웹 앱.

- 본관별 합격자 집계와 순위, 시험 유형 분포, 전성기 왕, 주요 거주지
- 인물 상세와 가족 관계(부자·형제 등)
- 왕대별 본관 순위, 본관 간 비교
- 성씨/본관 한글 검색 (정확히 일치 우선)

## 기술 스택

- Next.js 16.3 (App Router, `src/` 디렉토리), React 19, TypeScript strict, Tailwind CSS 4
- Prisma 7.9 + SQLite (better-sqlite3 driver adapter)
- 실데이터: 한국학중앙연구원 한국역대인물종합정보시스템 과거·취재 데이터 가공
  (합격 기록 84,525건 / 인물 69,181명 / 본관 2,976개 / 가족 관계 42,324건)

## 시작하기

```bash
npm install

# DB 스키마 생성 + 시드 (최초 1회, 결정적이므로 재실행해도 동일)
npm run db:push
npm run db:seed

# 개발 서버
npm run dev

# 프로덕션 빌드 + 실행
npm run build
npm run start
```

[http://localhost:3000](http://localhost:3000)에서 확인할 수 있다.

## 스크립트

| 스크립트 | 내용 |
| --- | --- |
| `npm run dev` | 개발 서버 (Turbopack) |
| `npm run build` | 프로덕션 빌드 (정적 생성 시 SQLite 쿼리 포함) |
| `npm run start` | 프로덕션 서버 |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:push` | `prisma db push` (스키마 반영) |
| `npm run db:seed` | `prisma db seed` (tsx prisma/seed.ts) |
| `npm run db:seed:notables` | Wikidata에서 본관별 유명 인물 수집 후 SQLite 적재 |

## AI 본관 리뷰

본관 상세 상단에 NVIDIA NIM(OpenAI 호환 엔드포인트, `meta/muse-glimmer-30b`)이
집계 데이터를 바탕으로 쓰는 유머 요약을 보여준다. 병맛/수다/다큐병/중계 4가지 톤이
랜덤 적용되며 "새 요약" 버튼으로 톤을 바꿔 다시 생성할 수 있다. 요약은 AI가 재미로
쓴 것으로 사실 확인용이 아니다.

```bash
# .env (gitignore 대상) — 키 없으면 AI 카드가 오류 문구만 표시
NVIDIA_API_KEY=nvapi-...
NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1
NVIDIA_MODEL=meta/muse-glimmer-30b
```

## 본관별 유명 인물

클랜 상세 페이지에 Wikidata(CC0) 기반 유명 인물을 노출한다. `npm run db:seed:notables`로 적재하며, Wikidata의 `P53`(가문) 속성으로 본관(Q846706)에 연결된 한국 인물을 수집해 우리 `clanId` 형식(예: `경주 김씨` → `경주-김`)으로 매핑해 저장한다.

## 데이터

- 스키마: `prisma/schema.prisma` (Person, Exam, PersonRelation)
- 시드: `prisma/seed.ts` — `prisma/real-data.json`(ingestion 결과)을 SQLite에 적재
- 수집: `scripts/ingest-real-data.mjs` — 원본 XLSX(문과/무과/생원/진사/친속)를
  정규화(본관·이름 병합, 연도/왕/등급 파생)하여 `prisma/real-data.json` 생성
- 등급은 원자료에 없는 근사값이다: 연도별 범주 내 순위로 파생(갑과 3/을과 7/병과 나머지)
- DB 파일: `prisma/dev.db` (gitignore 대상)

데이터 접근은 `src/lib/data/repository.ts`의 `DataRepository` 인터페이스로 단일화되어 있다.
기본은 SQLite(`PrismaDataRepository`), `DATA_SOURCE=mock` 환경변수를 주면 메모리 mock으로 동작한다.
인터페이스의 모든 조회는 비동기이며, UI(서버 컴포넌트/라우트 핸들러)는 이 인터페이스에만 의존한다.

```bash
DATA_SOURCE=mock npm run dev   # DB 없이 데모 데이터로 실행
```

## 구조

```
src/app/                  라우트 (서버 컴포넌트)
  /                       홈: 검색 + TOP 10 순위 미리보기
  /clans, /clans/[id]     본관 목록·검색·상세
  /people/[id]            인물 상세 (합격 기록 + 관계)
  /rankings               본관 랭킹 TOP 100 (정렬/유형 탭)
  /periods, /periods/[king]  왕대별 목록·순위
  /compare                본관 비교
  /exams, /about/data     시험 종류·데이터 소개
  /api/search             한글 검색 API (JSON)
src/components/           표·차트·탭·검색 등 재사용 컴포넌트
src/lib/data/             repository, types, mock-data, clan-roster, kings, db
prisma/                   schema, config, seed
generated/prisma/         Prisma 생성 클라이언트 (@db/* alias)
```

## 디자인 원칙

- 단일 강조색 `#0e4d7a`(딥 아카이브 블루), gradient/glow/둥근 카드/그림자 금지
- 표·목록·타임라인 중심의 정보 밀도 높은 레이아웃
- 데이터가 데모 샘플일 때는 데모 배너가 자동 노출된다
- 자세한 컴포넌트/API 계약은 `.omo/component-contract.md` 참고