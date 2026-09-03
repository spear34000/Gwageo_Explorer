<p align="center">
  <img src="public/gwageo-logo.png" alt="과거탐색기 로고" width="112" />
</p>

<h1 align="center">과거탐색기 (Gwageo Explorer)</h1>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.3.1-000000?logo=next.js&logoColor=white" alt="Next.js 16.3.1" />
  <img src="https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=111827" alt="React 19.2" />
  <img src="https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white" alt="TypeScript strict" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS 4" />
  <img src="https://img.shields.io/badge/Prisma-7.9-2D3748?logo=prisma&logoColor=white" alt="Prisma 7.9" />
  <img src="https://img.shields.io/badge/SQLite-3-003B57?logo=sqlite&logoColor=white" alt="SQLite" />
  <img src="https://img.shields.io/badge/Capacitor-6-119EFF?logo=capacitor&logoColor=white" alt="Capacitor 6" />
  <img src="https://img.shields.io/badge/license-MIT-2ea44f" alt="MIT license" />
</p>

조선시대 과거 합격 기록을 본관·인물·왕대별로 탐색하는 Next.js 웹앱입니다. 한국학중앙연구원 공개 데이터를 기반으로 84,525건의 기록, 2,976개 본관 조합, 인물 관계와 본관 위치를 제공합니다.

## 주요 기능

- 본관·성씨 검색 및 상세 페이지
- 합격 기록, 시험 종류, 왕대·순위 탐색
- 인물 상세와 관계 네트워크
- 한반도 전체 본관 발생지·거주지 지도
- 위치별 조사 상태와 공식 근거 링크
- NVIDIA NIM 기반 AI 요약(선택 기능)
- 반응형 웹과 Capacitor Android 앱

## 기술 스택

| 영역 | 사용 기술 | 역할 |
|---|---|---|
| 웹 프레임워크 | **Next.js 16.3.1** · App Router · Turbopack | SSR, 동적 라우트, API Route Handler |
| UI | **React 19.2** · TypeScript 5 | 서버/클라이언트 컴포넌트와 타입 안전한 화면 구성 |
| 스타일 | **Tailwind CSS 4** · CSS 토큰 | 반응형 레이아웃, 다크 테마, 지도·카드 스타일 |
| 인터랙션 | **anime.js 4** | 페이지 진입과 필터·카드 전환 모션 |
| 데이터 | **Prisma 7.9** · SQLite · better-sqlite3 | 84,525건 과거 기록과 본관 조사 데이터 조회 |
| 지도 | OpenStreetMap 호환 타일 · Web Mercator | 한반도 전체 본관 발생지·거주지 시각화 |
| AI | NVIDIA NIM OpenAI 호환 API · SSE | 서버 프록시를 통한 본관 요약 스트리밍 |
| 모바일 | **Capacitor 6** · Android SDK 36 · JDK 17 | `com.spear.gwageo` Android WebView 앱 |
| 품질 | ESLint 9 · `tsc --noEmit` · Gradle | 타입·린트·웹 production·APK release 검증 |

### 런타임 구성

```text
브라우저 ── HTTPS ──► Next.js 서버 ──► Repository ──► Prisma/SQLite
   │                         │
   ├─ KoreaMap (OSM tile)    └─ /api/ai-summary ──► NVIDIA NIM
   └─ AIClanSummary (SSE)

Android Capacitor WebView ──► https://spear.pics
```

웹 코드는 MIT로 배포하지만, 지도 타일과 제3자 데이터는 각 원 라이선스·귀속 조건을 유지합니다. 상세한 계층 책임과 데이터 흐름은 [아키텍처 문서](docs/ARCHITECTURE.md)를 참고하세요.

## 시작하기

```bash
npm install
npm run db:push
npm run db:seed
npm run dev
```

로컬 서버는 `http://localhost:3000`에서 실행됩니다. DB 없이 확인하려면 `DATA_SOURCE=mock npm run dev`를 사용하세요.

```bash
npm run typecheck
npm run lint
npm run build
npm run audit:release
```

## 데이터와 라이선스

애플리케이션 코드는 MIT 라이선스입니다. 제3자 데이터와 지도 타일은 각 원 라이선스를 유지하며 MIT로 재허가하지 않습니다. 출처·귀속은 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md), 이용 조건은 [docs/DATA-LICENSE.md](docs/DATA-LICENSE.md)에 기록합니다. 공식 근거와 허용 라이선스가 확인되지 않은 위치는 검토 상태로만 저장·표시합니다.

## Android 릴리즈 빌드

JDK 17과 Android SDK를 설정한 뒤 실행합니다.

```powershell
$env:JAVA_HOME='C:\Program Files\Java\jdk-17'
.\android\gradlew.bat -p android assembleRelease --no-daemon --console=plain
```

출력 파일은 `android/app/build/outputs/apk/release/app-release-unsigned.apk`입니다. 저장소에는 배포용 서명 키를 포함하지 않으므로 GitHub Release APK는 unsigned 빌드입니다. 일반 설치·스토어 배포에는 별도 keystore 서명이 필요합니다.

## 문서와 저장소

- [아키텍처](docs/ARCHITECTURE.md)
- [배포 가이드](docs/DEPLOYMENT.md)
- [데이터 라이선스](docs/DATA-LICENSE.md)
- [제3자 고지](THIRD_PARTY_NOTICES.md)

<https://github.com/spear34000/Gwageo_Explorer>
