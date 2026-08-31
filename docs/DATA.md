# 데이터 (Data)

## 원천 데이터

출처: **한국학중앙연구원 한국역대인물종합정보시스템** (AKS, 이용재 편)

- **과거 합격자:** 문과 15,151명, 무과 30,759명, 생원 21,179명, 진사 22,427명, 잡과 6,438명 등 총 **84,525건**
- **인물:** 69,181명 (병합 키: `성씨|본관|이름`)
- **본관:** 2,976개 (`전주-이` 같은 한글 슬러그)
- **관계:** 42,324건 (부/조부/증조부/외조부/장인 등)

원본 파일: `%TEMP%\opencode\aks-data\*.xlsx` (7개, gitignore, 삭제 금지)

```
mun.xlsx, mu.xlsx, saengwon.xlsx, jinsa.xlsx  # 노드 (합격자)
kin-mun.xlsx, kin-mu.xlsx, kin-sama.xlsx       # 친속 (관계)
```

## 파이프라인

```
aks-data/*.xlsx
  → scripts/ingest-real-data.mjs  (XLSX 파싱 + 정규화)
  → prisma/real-data.json         (22MB, 커밋 대상)
  → prisma/seed.ts                (Prisma createMany, chunk 5k)
  → prisma/dev.db                 (SQLite, gitignore)
```

### 정규화 규칙 (`ingest-real-data.mjs`)

- **본관:** `stripParens` → `normalizeBonGwan` (예: `전주이씨(全州李氏)` → `전주`)
  - 끝에 `씨`나 성씨가 붙으면 제거 (`김해김씨` → `김해`)
  - 없으면 `미상` → `clanId`는 `미상-김`, 표시는 `김씨 (본관 미상)`
- **인물 병합 키:** `surname|bonGwan|name` (동명이인 중 본관이 다르면 별도 인물)
- **연도:** `nid`에서 추출 (`PMn_1393_000001` → 1393)
- **왕:** `kingOfYear(year)`로 매핑 (27대, 태조 1392 ~ 고종 1894)
- **등급:** 원자료에 등급 필드가 없어 **연도별 `nid` 순번**으로 파생
  - 문과/무과: `갑과 1-3위 / 을과 4-10위 / 병과 11위~`
  - 생원/진사: `1등, 2등, ...`
- **관계:**
  - `kin-mun`: `New_ID`가 `PMn_`인 엣지만 (부/조부/증조부/외조부/장인, `+M` 자기참조 제외)
  - `kin-mu/sama`: `A1(부)`의 `이름+본관`이 합격자 DB와 정확 일치할 때만

## 스키마 (`prisma/schema.prisma`)

```prisma
model Person {
  id        String   @id // p-1, p-2, ...
  surname   String
  bonGwan   String
  clanId    String   // "전주-이"
  residence String   // "한성", "봉산" 등
  birthYear Int?
  deathYear Int?
  exams     Exam[]
  relations PersonRelation[] @relation("from")
  relatedBy PersonRelation[] @relation("to")
  @@index([clanId])
}

model Exam {
  id       String   @id // "mun-PMn_1393_000001"
  personId String
  type     ExamType // mun | mu | saengwon | jinsa
  year     Int
  kingId   String   // "yeongjo"
  grade    String   // "갑과 1위"
  @@index([personId, kingId])
}

model PersonRelation {
  personId        String
  relatedPersonId String
  type            String // father, grandfather, ...
  @@id([personId, relatedPersonId, type])
}
```

- **제약:** `Person.clanId`는 외래키가 아니라 문자열입니다 (본관은 합격 기록에서 파생된 집계 개념).
- **주의:** `PersonRelation`은 양방향으로 2행 저장됩니다 (예: A→B `father`, B→A `son`).

## 조회 레이어 (`src/lib/data/repository.ts`)

```ts
interface DataRepository {
  listClans(): Promise<ClanSummary[]>           // 전체 본관 집계 (순위)
  getClan(id: string): Promise<ClanDetail | null>
  searchClans(query: string): Promise<ClanSearchResult[]>
  listExamRecords(filters, page, pageSize): Promise<{items, total}>
  getPerson(id: string): Promise<PersonDetail | null>
  // ... listKings, periodRanking, topClans, getComparison, popularSearches
}
```

- **구현:** `PrismaDataRepository` (운영) / `MockDataRepository` (목업)
- **캐시:** `rowsPromise`/`summariesPromise`로 84k 행을 1회만 쿼리. `loadRows()`는 `prisma.exam.findMany({include: {person: true}})` 1회.
- **집계:** `buildClanSummaries(rows)`에서 `Map<clanId, counts>`로 `total/mun/mu/saengwon/jinsa` 집계 후 `rank` 부여.
- **관계:** `getPerson`에서 `prisma.personRelation.findMany({OR: [...]})` 후 `seenPairs`로 무방향 중복 제거 + `INVERSE_RELATION`으로 라벨 반전.

## 검색 (`src/lib/search.ts`)

- **정규화:** 공백 제거 + 끝 `씨` 제거 → 복성 60개 체크 → 마지막 글자=성씨, 앞부분=본관
- **스코어:** 0=정확 일치(`안동김`), 1=본관 포함+성씨 일치, 2=본관 일치, 3=성씨 일치, 4=부분 포함, 5=초성, 6=한자, 7=유사(Lev 1)
- **초성:** `toChosung`으로 한글을 `ㄱ-ㅎ`으로 변환 후 포함 검사
- **한자:** `HANJA_TO_HANGUL` 40여 개 매핑 (`金`→`김`, `海`→`해` 등) 후 재귀 검색
- **오타:** `levenshtein === 1`인 경우 `유사 검색`으로 반환

## 왕 (`src/lib/data/kings.ts`)

27대 왕, 재위 기간 포함:

```ts
{ id: "taejo", name: "태조", reignStart: 1392, reignEnd: 1398 },
...
{ id: "gojong", name: "고종", reignStart: 1863, reignEnd: 1894 }
```

`reignYear(kingId, year)`로 합격 연도를 재위 연차로 변환합니다.

## 제약 및 한계

- **등급은 근사값:** 원자료에 등급이 없어 순번으로 파생한 것이므로 실제 갑/을/병과와 다를 수 있습니다.
- **동명이인:** 성씨+본관+이름이 같으면 동일 인물로 병합됩니다. 실제 동명이인은 분리되지 않습니다.
- **관계 희소:** 친속 데이터가 `kin-mun`의 `A1-F1` 일부와 `kin-mu/sama`의 `A1`만 사용되므로, 전체 69k 중 관계가 있는 인물은 일부입니다.
- **거주지:** `residence`는 원자료의 `residence` 컬럼 그대로이며, 현대 지명과 다를 수 있습니다 (예: `봉산`, `한성`).

## 재현

```bash
# 원본 XLSX가 %TEMP%\opencode\aks-data에 있을 때
node scripts/ingest-real-data.mjs
# → prisma/real-data.json 재생성 (결정적, 재실행 시 동일)

npm run db:push
npm run db:seed
```
