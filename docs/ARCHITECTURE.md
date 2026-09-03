# 과거탐색기 아키텍처

## 1. 시스템 개요

과거탐색기는 조선시대 과거 합격 기록을 본관·인물·시험·왕대·거주지 기준으로 탐색하는 웹과 Android 앱이다.

```text
AKS XLSX / 허용된 공식 자료
        │
        ▼
수집·정규화 스크립트 (scripts/)
        │  재현 가능한 JSON + manifest
        ▼
Prisma seed ───────────────► SQLite (로컬/서버)
        │
        ▼
DataRepository (Prisma 또는 mock)
        │
        ├── Next.js Server Components / Route Handlers
        │       ├── 검색·목록·상세·비교·랭킹 라우트
        │       └── /api/ai-summary (SSE 프록시)
        │
        └── React Client Components
                ├── KoreaMap (Web Mercator)
                ├── AIClanSummary (스트리밍·캐시)
                └── anime.js 인터랙션

Capacitor Android ── HTTPS 원격 WebView ──► https://spear.pics
```

## 2. 기술 스택 상세

| 계층 | 기술 | 적용 방식과 책임 |
|---|---|---|
| 런타임 | Node.js 20+, JDK 17(Android) | 서버 실행, 데이터 스크립트, APK 컴파일 |
| 웹 프레임워크 | Next.js 16.3 App Router, Turbopack | `src/app` 라우팅, SSR, 정적·동적 렌더링, Route Handler |
| UI 런타임 | React 19.2 | Server Component에서 데이터 조회, Client Component에서 필터·상호작용 관리 |
| 언어 | TypeScript 5, `strict: true` | 도메인 타입 계약과 repository 경계 보장. `any`와 `@ts-ignore` 금지 |
| 스타일 | Tailwind CSS 4 + `globals.css` | 토큰, 반응형 레이아웃, 지도·테이블 공통 클래스 |
| 모션 | anime.js 4 | 페이지 진입, 카드·필터 전환 등 제한적인 UI 모션. 데이터 렌더링과 분리 |
| ORM/DB | Prisma 7.9 + `@prisma/adapter-better-sqlite3` + SQLite | `prisma/schema.prisma`를 단일 스키마로 사용. 서버 배포 DB는 별도 파일 |
| 생성 코드 | Prisma Client (`generated/prisma`) | `@db/*` alias를 통해 타입 안전한 쿼리 수행 |
| 지도 | OpenStreetMap 호환 타일 + 자체 Web Mercator 투영 | 타일 URL은 `NEXT_PUBLIC_MAP_TILE_URL`; 화면에 타일·데이터 attribution을 분리 표시 |
| AI | NVIDIA NIM OpenAI 호환 API | 서버에서만 `NVIDIA_API_KEY` 사용, SSE로 중계, 모델은 `nvidia/nemotron-3.5-lightning-30b-a3b` |
| 이미지 저장 | `html-to-image` + Capacitor Filesystem 6 | 브라우저는 download 링크, Android는 Documents 디렉터리에 저장 |
| 모바일 셸 | Capacitor 6 Android | `com.spear.gwageo`, `server.url=https://spear.pics`; 웹 번들은 서버에서 갱신 |
| 품질 도구 | ESLint 9, `tsc`, Gradle | 타입·문법·웹 빌드·APK release 빌드 검증 |
| 배포 | GitHub + GitHub Releases, Caddy/서비스 | 소스는 MIT, 데이터는 원 라이선스 유지. APK는 별도 release asset |

## 3. 디렉터리와 의존성 방향

```text
src/app/                 라우트와 서버 조합 (lib를 호출)
src/components/          브라우저 UI (repository 직접 호출 금지)
src/hooks/               클라이언트 상태·SSE·캐시
src/lib/data/             타입, repository, Prisma/mock 구현
src/lib/historical-places 지명 정규화·좌표·시대별 거주지
prisma/                  스키마, seed, 정규화 데이터, manifest
scripts/                 ingest, 조사 보강, 라이선스·좌표 감사
android/                 Capacitor 생성 Android 프로젝트
docs/                    아키텍처·배포·데이터 라이선스
```

의존성은 `app → components/hooks → lib/data` 방향을 따른다. UI는 `getRepository()`를 통해서만 데이터를 읽고 Prisma Client를 직접 import하지 않는다. mock과 Prisma 구현은 동일한 `DataRepository` 계약을 구현한다.

## 4. 데이터 계층

핵심 모델은 `Person`, `Exam`, `PersonRelation`, `ClanResearch`, `ClanLocation`, `ClanLocationEvidence`다. 본관 발생지, 행정구역 변천, 주요 세거지는 위치 유형으로 구분한다. 조사 상태는 `verified`, `ambiguous`, `no_official_source`, `outside_korea`, `review_required`, `license_blocked`로 분류한다.

수집 흐름은 `ingest-real-data.mjs → real-data.json → seed.ts → SQLite`다. 본관 조사 결과는 `generate-clan-research.mjs`와 `backfill-clan-locations.ts`로 재생성할 수 있으며, `dataset-manifest.json`에 해시·출처·수집일을 기록한다. 84,525건 집계와 본관 요약은 `rowsPromise`·`summariesPromise`로 캐시하여 요청마다 재계산하지 않는다.

## 5. 요청 흐름과 캐싱

동적 라우트의 `params`와 `searchParams`는 Promise이므로 서버에서 `await`한다. 한글 slug는 `decodeURIComponent` 후 repository에 전달한다. 검색·목록은 서버 렌더링하고, 필터·지도·AI 스트림은 클라이언트 상태로 처리한다. AI 결과는 clan·tone별 `sessionStorage`에 캐시하며 사용자가 재생성할 때만 새 요청을 보낸다.

## 6. 지도 렌더링

`getClanLocations(clanId)`가 좌표와 조사 근거를 반환한다. 발생지(보라색), 검증된 거주지(파란색), 검토 중·미확인(주황색), 비활성/근거 없음(회색)을 구분한다. 남북을 포함한 한반도 bounds를 고정하고 실제 위·경도를 Web Mercator로 투영한다. SSR과 클라이언트가 동일한 반올림 좌표·크기 문자열을 사용해 hydration mismatch를 방지한다.

## 7. AI와 보안

브라우저는 `/api/ai-summary`만 호출한다. Route Handler가 API 키를 보관하고 NVIDIA NIM에 요청한 뒤 `text/event-stream`으로 토큰을 중계한다. 서버 출력은 300 tokens, 클라이언트 표시 문자열은 420자에서 제한한다. 키·`.env`·로컬 DB는 Git에 포함하지 않는다.

## 8. Android·배포

Capacitor 앱은 원격 HTTPS WebView이므로 새 웹 기능은 서버 배포 후 앱에서 반영된다. APK 생성:

```powershell
$env:JAVA_HOME='C:\Program Files\Java\jdk-17'
npx cap sync android
android\gradlew.bat -p android assembleRelease --no-daemon --console=plain
```

`app-release-unsigned.apk`는 release 최적화만 적용된 unsigned 산출물이다. 스토어 배포에는 저장소 밖의 운영 keystore와 서명 설정이 필요하다.

## 9. 검증과 운영 원칙

```text
npm run typecheck → npm run lint → npm run build
npm run audit:clans / audit:location-evidence / audit:official-provenance
./android/gradlew assembleRelease
```

모든 본관 조합은 조사 상태를 가져야 하며, `verified` 위치는 좌표·공식 URL·허용 라이선스·확인일이 모두 있어야 한다. OSM 타일은 제공자 약관과 attribution을 준수하고, 제3자 데이터는 `THIRD_PARTY_NOTICES.md`와 `docs/DATA-LICENSE.md`에서 원 라이선스를 명시한다.
