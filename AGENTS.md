<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# 과거탐색기 - 프로젝트 가이드

Next.js 16.3(App Router, Turbopack) + Prisma 7.9(SQLite)에서 조선시대 과거 합격 기록(한국학중앙연구원 실데이터 84,525건)을 본관·인물·왕대 기준으로 탐색하는 웹앱.

## Architecture

### Core Tech Stack
- Runtime: Node.js, Next.js 16.3 App Router, `src/` 디렉토리
- Type System: TypeScript strict (`tsc --noEmit` 통과, `any`/`@ts-ignore` 금지)
- Styling: Tailwind CSS 4 (`globals.css` 토큰 + `.data-table`/`.bar-row` 등 CSS 클래스)
- Data: Prisma 7.9 + SQLite, `generated/prisma`의 `@db/*` alias
- Tests: 없음. 검증은 `tsc` + `lint` + `build` + 라우트 실동작

### 이 프로젝트만의 특이사항
- **Next 16.3은 트레이닝 데이터와 다르다**: 상단 nextjs 블록대로 `node_modules/next/dist/docs/` 먼저 읽을 것
- **동적 라우트 `params`/`searchParams`는 Promise**: `await` 필수
- **이 버전은 params를 URL 디코딩하지 않는다**: 한국어 id(`전주-이`)는 `decodeURIComponent(id)` 후 조회·링크에 사용 (`src/app/clans/[id]/page.tsx`)
- **본관 id는 한글 slug**: `전주-이` 형식, 본관 미상 = `{성}씨 (본관 미상)`. mock은 ASCII(`andong-kim`)라 다름
- **모든 repository 조회는 비동기**: 싱글턴 `getRepository()`, `DATA_SOURCE=mock`이면 메모리 mock
- **본관 집계(84,525행 기반)는 비쌈**: `PrismaDataRepository`의 `rowsPromise`/`summariesPromise` 캐시 사용, 재계산 금지
- **관계는 양방향 저장**: `getPerson`에서 무방향 중복 제거 + `INVERSE_RELATION`으로 역방향 라벨 반전. 관계 유형 추가 시 `RELATION_LABELS`와 `INVERSE_RELATION` 둘 다 갱신
- **실데이터 파이프라인**: `scripts/ingest-real-data.mjs` → `prisma/real-data.json`(커밋 대상) → `prisma/seed.ts`. 등급은 원자료에 없어 범주 내 순위로 파생한 근사값
- **커밋 금지**: 파일 작성만. 커밋/푸시는 사용자 명시 요청 시에만
- **개발 서버 detached**: `npx next dev -p 3000`, 로그 `%TEMP%\opencode\dev3000.log`. 포트 3000을 wslrelay가 점유하면 전 요청 404

### Device Info
- Windows (win32), PowerShell 5.1 — 한국어 텍스트는 `node -e` 인라인 금지, .mjs 임시 파일 사용
- 프로젝트 루트: `C:\Users\spear\project\spear_ex`
- 원본 데이터: `%TEMP%\opencode\aks-data\*.xlsx` (7개, 삭제 금지)

## Development Docs

작업 전 아래 문서를 먼저 읽고 진행할 것을 권장한다.

- 구현 계약 (API/컴포넌트/라우트/디자인): [.omo/component-contract.md](.omo/component-contract.md)
- 개요·스크립트·구조: [README.md](README.md)
- Next.js 가이드: `node_modules/next/dist/docs/`
- 타입: `src/lib/data/types.ts`, 왕 목록: `src/lib/data/kings.ts`

## Mandatory Code Review Process

Code review is performed at **two checkpoints**:
1. **After each subtask**: Review code written during that task
2. **After the entire task**: Integrated review

### Review Checklist
1. **Requirements compliance**: Conformance with development docs and requirements
2. **Code style**: Consistency with the existing codebase style
3. **Room for improvement**: Review from stability, scalability, efficiency, and security perspectives
4. **Code integration**: Verify function signatures, import paths, API response formats, and connections to other code — **no guessing; always search the actual code.**
5. **Compatibility**: API/policy differences across OS versions, etc.
6. **Dry run**: Trace through the actual code flow to validate behavior

If an issue is found, **fix it immediately, even if minor.** However, if user input is required or integration with unimplemented code is needed, mark it with a **TODO comment** and report to the user.