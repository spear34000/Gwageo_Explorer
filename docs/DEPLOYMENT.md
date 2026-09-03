# 배포 (Deployment)

## 로컬

```bash
npm install
npm run db:push
npm run db:seed          # 69,181 인물 / 84,525 합격
npm run dev              # http://localhost:3000 (Turbopack)
```

- `DATA_SOURCE=mock`이면 DB 없이 동작: `DATA_SOURCE=mock npm run dev`
- 현재 Next.js 16.3 기준으로 `npm run build`가 기본 빌드 명령이다. CI에서는 빌드 전에 데이터·출처 감사도 실행한다.

## 프로덕션 빌드

```bash
npm run build
npm run start            # http://localhost:3000
```

- `next build` 시 SQLite 파일(`prisma/dev.db`)을 읽어 정적 생성에 포함
- `output: "standalone"` 미사용 — `next start`로 실행

## 환경 변수 (`.env`, gitignore)

```bash
# AI 요약 (선택, 없으면 오류 문구만 표시)
NVIDIA_API_KEY=nvapi-...
NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1
NVIDIA_MODEL=nvidia/nemotron-3.5-lightning-30b-a3b

# 데이터 소스 (선택, 공개 배포 기본값은 실제 DB)
DATA_SOURCE=mock

# 지도 타일 제공자(공개 배포 시 약관에 맞는 제공자로 지정)
NEXT_PUBLIC_MAP_TILE_URL=https://tile.openstreetmap.org/{z}/{x}/{y}.png
```

- `NVIDIA_API_KEY`는 서버(`route.ts`)에서만 사용, 클라이언트로 노출되지 않음
- 개발 중 노출된 키는 교체 권장

## 원격 (VPS)

이전 배포는 `spear.pics` (VPS, 4300 포트, `pm2` 또는 `systemd`)로 수행되었습니다.

```bash
# 로컬에서 빌드 후 전송 (예시)
npm run build
scp -r .next package.json package-lock.json prisma public user@host:/app
ssh user@host "cd /app && npm ci --omit=dev && npx prisma generate && npx prisma db push && npx prisma db seed && pm2 restart gwageo"
```

- `prisma/dev.db`는 gitignore이므로 별도 전송 또는 원격에서 `db:seed` 필요
- `allowedDevOrigins: ["127.0.0.1"]`는 `next.config.ts`에 설정 (HMR 크로스 오리진)
- 공개 배포 전 `npm run audit:clans && npm run audit:sources && npm run audit:release && npm run audit:location-evidence`를 통과시키고,
  OSM 저작권 표시가 보이는지 확인한다.

## GitHub

- 원격: `https://github.com/spear34000/Gwageo_Explorer.git` (`main`)
- 푸시: `.env`, `prisma/dev.db`, `generated/`, `node_modules`, `.next` 제외 (`.gitignore`)
- 최근 커밋: `b1b3e32` (실제 스크린샷), `9c466ba` (검색/시각화), `8b72d37` (hydration fix) 등

```bash
git push origin main
```

- `README.md`의 스크린샷은 `public/screenshots/*.png` (Playwright로 `spear.pics` 캡처) — `placehold.co` → 실제 이미지로 교체됨

## 도커 (선택)

현재 `Dockerfile` 없음. 필요 시:

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate && npm run build -- --webpack
EXPOSE 3000
CMD ["npm", "start"]
```

- `prisma/dev.db`는 볼륨으로 마운트하거나 빌드 시 `db:seed` 필요

## 체크리스트

- [ ] `npm run typecheck` 통과
- [ ] `npm run lint` 통과
- [ ] `npm run build` 통과
- [ ] `npm run audit:clans`, `npm run audit:sources`, `npm run audit:release` 통과
- [ ] `npm run audit:location-evidence` 통과 (검증 위치 1,000건 이상)
- [ ] `http://localhost:3000`에서 검색/상세/랭킹 동작 확인
- [ ] `.env` 없이도 AI 카드가 오류 문구를 정상 표시하는지 확인
