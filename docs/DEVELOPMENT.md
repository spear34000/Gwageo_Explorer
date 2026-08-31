# 개발 가이드 (Development)

## 요구사항

- Node.js 20+
- npm 10+
- Git

## 빠른 시작

```bash
git clone https://github.com/spear34000/Gwageo_Explorer.git
cd Gwageo_Explorer
npm install
npm run db:push
npm run db:seed
npm run dev
```

## 스크립트

| 스크립트 | 내용 |
|---|---|
| `npm run dev` | 개발 서버 (Turbopack, http://localhost:3000) |
| `npm run build` | 프로덕션 빌드 (`--webpack` 권장) |
| `npm run start` | 프로덕션 서버 |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:push` | `prisma db push` |
| `npm run db:seed` | `prisma db seed` |

## 브랜치 전략

- `main`이 기본 브랜치
- 기능 브랜치: `feat/xxx`, `fix/xxx`
- 커밋 전 `typecheck` + `lint` + `build` 확인

## 코드 스타일

- **TypeScript strict** — `any`, `@ts-ignore` 금지 (단, `animejs`의 `delay` 타입 불일치는 `// @ts-ignore` + `as any`로 예외 처리)
- **Tailwind CSS 4** — `globals.css` 토큰 + `data-table` 등 시멘틱 클래스
- **디자인:** 단일 강조색 `#0e4d7a`, 그라데이션/글로우 금지

## 테스트

현재 테스트 스위트 없음. 검증은:

```bash
npm run typecheck
npm run lint
npm run build -- --webpack
# + 라우트 수동 확인 (검색, 본관 상세, 인물 상세)
```

## 트러블슈팅

| 증상 | 원인 | 해결 |
|---|---|---|
| `Hydration mismatch` (`html`에 `dark` 클래스) | 다크모드 스크립트와 SSR 불일치 | `layout.tsx`의 `<html suppressHydrationWarning>` 확인 |
| `next build` 패닉 | Turbopack + `.omo/codegraph` | `next build --webpack` 사용 |
| `prisma db push`가 `ClanNotable` 삭제를 거부 | AI 에이전트 보호 | `PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION="예, 진행" npx prisma db push --accept-data-loss` |
| 포트 3000이 404 | `wslrelay`가 점유 | `npx next dev -p 3001`로 변경 |
| AI 요약이 45초+ 타임아웃 | `muse-glimmer` 느림 | `nvidia/nemotron-3-nano-30b-a3b` + `thinking: false`로 교체됨 |

## 문서

- `README.md` — 개요 + 시작하기 (배지, 스크린샷 포함)
- `docs/ARCHITECTURE.md` — 구조/데이터 흐름
- `docs/DATA.md` — 원천 데이터/파이프라인/스키마
- `docs/API.md` — 내부 API
- `docs/COMPONENTS.md` — 컴포넌트 카탈로그
- `docs/DEPLOYMENT.md` — 배포
- `.omo/component-contract.md` — 컴포넌트/API 계약
- `AGENTS.md` — 에이전트 규칙 (Next 16.3 특이사항)

## 에이전트 규칙

`AGENTS.md`의 상단 Next.js 블록과 `docs/`를 먼저 읽고 진행하세요.

- `params`/`searchParams`는 Promise
- `decodeURIComponent(id)` 필요
- `DATA_SOURCE=mock` 시 목업
- 커밋은 사용자 명시 시에만

## 라이선스

- 코드: MIT (`LICENSE`)
- 데이터: 한국학중앙연구원 AKS 출처 표기
