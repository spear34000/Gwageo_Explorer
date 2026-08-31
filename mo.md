# 과거탐색기 - 아키텍처 및 구조

조선시대 과거 합격 기록(한국학중앙연구원 실데이터 84,525건)을 본관·인물·왕대 기준으로
탐색하는 Next.js 웹앱. 본 문서는 DB 구조와 전체 아키텍처를 정리한다.

## 1. 기술 스택

- Next.js 16.3 (App Router, `src/`), React 19, TypeScript strict
- Tailwind CSS 4 (CSS 변수 토큰 시스템)
- Prisma 7.9 + SQLite (better-sqlite3 driver adapter)
- 외부 AI: NVIDIA NIM (OpenAI 호환 엔드포인트, `meta/muse-glimmer-30b`)
- 빌드: 반드시 `next build --webpack` (Turbopack은 `.omo/codegraph` 경로 버그로 패닉)

## 2. DB 구조 (Prisma schema)

`prisma/schema.prisma`에 3개 모델 + 1개 enum.

### ExamType (enum)
`mun`(문과) / `mu`(무과) / `saengwon`(생원) / `jinsa`(진사)

### Person (인물)
| 필드 | 타입 | 비고 |
| --- | --- | --- |
| id | String | PK |
| name | String | 이름 |
| surname | String | 성 |
| bonGwan | String | 본관(한글) |
| clanId | String | 본관 id (한글 slug, 예: `전주-이`) |
| residence | String | 주요 거주지 |
| birthYear / deathYear | Int? | 추정 연도 |
| exams | Exam[] | 합격 기록 (1:N) |
| relations / relatedBy | PersonRelation[] | 관계 (from / to 방향 각각) |

- 인덱스: `clanId`

### Exam (합격 기록)
| 필드 | 타입 | 비고 |
| --- | --- | --- |
| id | String | PK |
| personId | String | FK -> Person (onDelete: Cascade) |
| type | ExamType | 시험 종류 |
| year | Int | 합격 연도 |
| kingId | String | 왕대 id |
| grade | String | 등급 라벨 (갑과 1위 / 을과 / 1등 등, 원자료에 없어 파생) |

- 인덱스: `personId`, `kingId`

### PersonRelation (가족 관계)
| 필드 | 타입 | 비고 |
| --- | --- | --- |
| personId | String | FK -> Person ("from") |
| relatedPersonId | String | FK -> Person ("to") |
| type | String | 관계 유형 (father / son / brother ...) |

- 복합 PK: `[personId, relatedPersonId, type]`
- Person 모델에 `relations`(from) / `relatedBy`(to) 두 관계로 양방향 저장

### 관계 모델의 핵심
- `Person`과 `PersonRelation`은 같은 모델을 가리키는 두 관계(`"from"`, `"to"`)로 M:N 표현
- `getPerson`에서 무방향 중복을 제거하고 `INVERSE_RELATION`으로 역방향 라벨을 반전
- 관계 유형을 추가할 때는 `RELATION_LABELS`와 `INVERSE_RELATION`을 반드시 함께 갱신

### 시드 파이프라인
1. `scripts/ingest-real-data.mjs`: 원본 XLSX(문과/무과/생원/진사/친속) 정규화 -> `prisma/real-data.json` (커밋 대상)
2. `prisma/seed.ts`: `real-data.json` -> SQLite 적재
3. 등급은 원자료에 없으므로 연도별 범주 내 순위로 파생 (갑과 3 / 을과 7 / 병과 나머지)
4. DB 파일: `prisma/dev.db` (gitignore 대상)

## 3. 데이터 레이어 아키텍처

```
UI (Server Component / Route Handler)
        │  DataRepository 인터페이스만 의존
        ▼
getRepository()  ──► PrismaDataRepository (SQLite, 기본)
        │            MockDataRepository   (DATA_SOURCE=mock)
        ▼
BaseClanRepository (추상 클래스: 공통 집계 로직)
```

- **인터페이스 우선**: UI는 `DataRepository`(`src/lib/data/types.ts`)만 바라본다.
  구현이 Prisma/SQLite에서 mock으로 바뀌어도 UI/비즈니스 로직은 변경 없음.
- **구현체**: `PrismaDataRepository`(기본), `MockDataRepository`(`DATA_SOURCE=mock`),
  공통 로직은 `BaseClanRepository` 추상 클래스에 위임.
- **싱글턴**: `getRepository()`가 인스턴스를 반환하고 `repository`로 export.
- **비용 큰 집계 캐싱**: `PrismaDataRepository`는 `rowsPromise` / `summariesPromise`로
  84,525행 기반 본관 집계를 메모이즈한다. 재계산 금지.
- **본관 id 규칙**: 한글 slug (`전주-이`). 본관 미상 = `{성}씨 (본관 미상)`.
- **Next 16.3 특이사항**:
  - 동적 라우트 `params` / `searchParams`는 `Promise` -> `await` 필수
  - 이 버전은 `params`를 URL 디코딩하지 않음 -> 한국어 id는 `decodeURIComponent(id)` 후 조회/링크

## 4. UI / 라우트 구조

```
src/app/
  /                       홈: 검색 + TOP 10 순위
  /clans, /clans/[id]     본관 목록·검색·상세 (AI 리뷰 포함)
  /people/[id]            인물 상세 (합격 기록 + 관계)
  /rankings               본관 랭킹 TOP 100
  /periods, /periods/[king]  왕대별 목록·순위
  /compare                본관 비교
  /exams, /about/data     시험 종류·데이터 소개
  /api/search             한글 검색 API (JSON)
  /api/ai-summary         AI 본관 리뷰 API (SSE 스트리밍)

src/components/           표·차트·탭·검색, Header, Footer, DemoBanner,
                         AIClanSummary(포스터), ThemeToggle
src/hooks/               useAIStream (SSE 스트리밍 훅)
src/lib/data/            repository, types, mock-data, clan-roster, kings, db
```

- 페이지는 서버 컴포넌트. 데이터는 `repository` 싱글턴을 통해 비동기 조회.
- `Header`는 클라이언트 컴포넌트(`usePathname`), `ThemeToggle`도 클라이언트.

## 5. AI 본관 리뷰

- 엔드포인트: `src/app/api/ai-summary/route.ts` (SSE, `stream: true`)
- 모델: `meta/muse-glimmer-30b` (추론형 -> `max_tokens` 4096 필수, 512면 content 비어 CoT 노출)
- 프롬프트: `TONE_INSTRUCTIONS` 4종(memes/friend/docu/hype) + `buildPrompt(detail, tone)` + `?tone=` 쿼리
- 톤: 단정적 평론 선언체, 대화체/의문문/CoT/영어 금지
- `useAIStream`: `reasoning_content`는 무시하고 `delta.content`만 표시, abort 가드로
  언마운트 후 setState 방지
- 포스터 카드: 512x512 정사각형 (`backgroundColor` 지정), "사진으로 저장하기"만
  (`html-to-image` toPng -> 다운로드)

## 6. 테마 (다크 모드)

- CSS 변수 토큰 시스템: `:root`(라이트) + `.dark`(오버라이드) in `globals.css`
- `@theme inline`로 변수를 Tailwind 클래스(`bg-background`, `text-foreground`,
  `border-line`, `text-accent` 등)에 매핑 -> `.dark`에서 변수만 바꾸면 전체 적용
- `ThemeToggle`(클라이언트, `useSyncExternalStore`): `localStorage`에 저장,
  `.dark` 클래스를 `<html>`에 토글
- `layout.tsx`의 no-flash 인라인 스크립트: 저장값 우선, 없으면
  `prefers-color-scheme: dark` 따름 (페인트 전 적용되어 깜빡임 없음)
- 강조색은 다크에서 대비 확보를 위해 밝게 조정 (#0e4d7a -> #4a9bd4)

## 7. 빌드 / 배포

- 프로덕션 빌드: `next build --webpack` (Turbopack 금지)
- 개발 서버: `next dev --webpack` + `next.config.ts`의 `allowedDevOrigins: ["127.0.0.1"]`
  (Next 16이 127.0.0.1을 cross-origin 취급해 HMR 웹소켓 차단 -> 하이드레이션 실패 방지)
- `.next` 캐시 오염 시 "Manifest file is empty" / Fast Refresh 루프 -> 삭제 후 재시작
- 배포 대상: `100.76.167.71:4300` (계정 `spear`)
  - Windows zip의 백슬래시가 Linux 권한(`d?????????`)을 깨뜨림 ->
    개별 파일 `scp` + `sudo chmod -R 755` 권장
  - `rm -rf ~/spear_ex/*`는 `node_modules`도 지우므로 재설치 필요
  - `prisma db push` + `seed` 누락 시 Exam 테이블 없음 에러
- `.env`(gitignore): `NVIDIA_API_KEY`, `NVIDIA_BASE_URL`, `NVIDIA_MODEL` (키 노출 시 로테이션 권고)

## 8. 디렉토리 요약

```
prisma/
  schema.prisma          스키마 (Person/Exam/PersonRelation)
  seed.ts                real-data.json -> SQLite
  real-data.json         ingestion 결과 (커밋 대상)
  dev.db                 SQLite 파일 (gitignore)
scripts/
  ingest-real-data.mjs  XLSX -> real-data.json
src/
  app/                   라우트 + API
  components/            UI 컴포넌트
  hooks/                 useAIStream
  lib/data/              repository/types/mock-data/clan-roster/kings/db
generated/prisma/        Prisma 생성 클라이언트 (@db/* alias)
```
