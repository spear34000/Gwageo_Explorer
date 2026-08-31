# Historical Place Map Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace guessed map coordinates with a source-backed, Hanja-aware historical place resolver covering every bon-gwan and residence value in the real dataset.

**Architecture:** A pure resolver consumes a static historical-place gazetteer and returns `resolved`, `ambiguous`, or `unknown`. `KoreaMap` renders only resolved results, reports unresolved counts, and never performs prefix or runtime geocoding. A standalone audit validates dataset coverage, coordinate bounds, collisions, and provenance.

**Tech Stack:** Next.js 16.3, React 19, strict TypeScript, Node test runner through `tsx`, Tailwind CSS 4, OpenStreetMap raster tiles, anime.js.

**Spec:** `docs/superpowers/specs/2026-08-31-historical-place-map-design.md`

## Global Constraints

- Preserve the existing App Router and Client Component boundary.
- Use full `Hangul(Hanja)` residence labels; never remove Hanja for automatic matching.
- Never use prefix, substring, or first-two-character fallback matching.
- Every resolved place has provenance and `verified` or `approximate` confidence.
- Unknown and ambiguous values remain visible in counts but receive no marker.
- Runtime geocoding APIs are prohibited.
- Do not commit or push without explicit user instruction.

---

### Task 1: Historical place resolver

**Files:**
- Create: `src/lib/historical-places/types.ts`
- Create: `src/lib/historical-places/places.ts`
- Create: `src/lib/historical-places/resolve-place.ts`
- Create: `src/lib/historical-places/resolve-place.test.ts`
- Modify: `package.json`

**Interfaces:**
- Produces: `resolveResidence(label: string): PlaceResolution`
- Produces: `resolveBonGwan(bonGwan: string, surname?: string): PlaceResolution`
- Produces: `HistoricalPlace`, `ResolvedPlace`, and `PlaceResolution` types.

- [ ] **Step 1: Add the test command and failing resolver tests**

Add `"test": "tsx --test src/**/*.test.ts"` and table-driven tests asserting literal outcomes for:

```ts
assert.equal(resolveResidence("영천(榮川)").status, "resolved");
assert.equal(resolveResidence("영천(榮川)").place.id, "yeongcheon-yeongju");
assert.equal(resolveResidence("영천(永川)").place.id, "yeongcheon-city");
assert.equal(resolveResidence("광주(廣州)").place.id, "gwangju-gyeonggi");
assert.equal(resolveResidence("광주(光州)").place.id, "gwangju-jeolla");
assert.equal(resolveResidence("영천(없는한자)").status, "unknown");
assert.equal(resolveResidence("").status, "unknown");
assert.equal(resolveResidence("미상").status, "unknown");
```

- [ ] **Step 2: Run the tests and verify RED**

Run: `npm.cmd test -- --test-name-pattern="historical place resolver"`

Expected: FAIL because the resolver modules do not exist.

- [ ] **Step 3: Implement the types and exact resolver**

Use a discriminated union:

```ts
export type PlaceResolution =
  | { status: "resolved"; input: string; place: HistoricalPlace }
  | { status: "ambiguous"; input: string; candidates: readonly HistoricalPlace[] }
  | { status: "unknown"; input: string; reason: "empty" | "not-found" | "not-specific" };
```

Build exact label and bon-gwan override indexes once at module load. Normalize Unicode with `NFC` and trim whitespace only. Return `ambiguous` when an exact label maps to multiple places.

- [ ] **Step 4: Run tests and verify GREEN**

Run: `npm.cmd test -- --test-name-pattern="historical place resolver"`

Expected: all resolver tests PASS.

- [ ] **Step 5: Review Task 1**

Check requirements, exact-match behavior, strict types, index construction, and absence of prefix matching. Fix every issue and rerun `npm.cmd test` and `npm.cmd run typecheck`.

### Task 2: Source-backed real-data gazetteer

**Files:**
- Modify: `src/lib/historical-places/places.ts`
- Create: `src/lib/historical-places/places.test.ts`
- Modify: `scripts/audit-map-coverage.mjs`

**Interfaces:**
- Consumes: `HistoricalPlace` and resolver APIs from Task 1.
- Produces: `HISTORICAL_PLACES`, `BON_GWAN_OVERRIDES`, and an audit JSON summary.

- [ ] **Step 1: Extract the complete input vocabulary**

Update the audit script to read all `data.clans[].bonGwan` and `data.persons[].residence` values and emit sorted unique lists, frequencies, resolver status totals, and unresolved values.

- [ ] **Step 2: Write failing gazetteer invariant tests**

Assert that every place has a unique ID, valid latitude `30..44`, valid longitude `123..132`, non-empty modern area, valid HTTPS source URL, confidence and precision values, and at least one unique label. Assert that the four known Hanja-specific test places resolve separately.

- [ ] **Step 3: Run the invariant tests and verify RED**

Run: `npm.cmd test -- --test-name-pattern="gazetteer invariants"`

Expected: FAIL on incomplete place metadata or missing real-data coverage.

- [ ] **Step 4: Populate all source-verifiable places**

For each unique residence and bon-gwan, add an exact label or bon-gwan override only after determining the historical location from 한국민족문화대백과사전, 한국학중앙연구원 resources, 국토지리정보원, or an explicitly documented secondary fallback. Assign `approximate` whenever the coordinate is a modern administrative center rather than a verified historical 읍치.

- [ ] **Step 5: Classify every unresolved input**

Maintain explicit non-map classifications for empty, unknown, insufficiently specific, ambiguous, and outside-Korea values so that every input belongs to exactly one status without fabricated coordinates.

- [ ] **Step 6: Run tests and the full audit**

Run: `npm.cmd test`

Run: `node scripts/audit-map-coverage.mjs`

Expected: all invariants PASS; audit totals equal the real-data totals and contain no unclassified input.

- [ ] **Step 7: Review Task 2**

Check every source URL, Hanja collision, coordinate hemisphere/order, North Korean coverage, and bon-gwan surname override. Fix issues immediately and rerun the audit.

### Task 3: Map integration and unresolved-place disclosure

**Files:**
- Modify: `src/components/KoreaMap.tsx`
- Modify: `src/components/ClanDetailClient.tsx`
- Create: `src/lib/historical-places/map-model.ts`
- Create: `src/lib/historical-places/map-model.test.ts`

**Interfaces:**
- Consumes: `resolveResidence`, `resolveBonGwan`, and `PlaceResolution`.
- Produces: `buildMapModel({ residences, bonGwan, surname })` returning grouped markers and unresolved entries.

- [ ] **Step 1: Write failing map-model tests**

Use literal fixtures to prove that resolved residences group only by exact coordinates, counts are summed, unresolved entries retain their original labels and counts, the bon-gwan uses its surname override, and `verified`/`approximate` confidence survives into marker data.

- [ ] **Step 2: Run map-model tests and verify RED**

Run: `npm.cmd test -- --test-name-pattern="map model"`

Expected: FAIL because `buildMapModel` does not exist.

- [ ] **Step 3: Implement the pure map model**

Return serializable marker objects with fixed coordinate tuples, grouped residences, total counts, confidence, and source metadata. Never mutate props or resolver data.

- [ ] **Step 4: Run map-model tests and verify GREEN**

Run: `npm.cmd test -- --test-name-pattern="map model"`

Expected: PASS.

- [ ] **Step 5: Replace `PLACE_COORDS` and `coordFor` in `KoreaMap`**

Pass `surname` into the component, consume `buildMapModel`, render only resolved markers, and use fixed-precision strings for marker position and size. Keep anime.js marker entry animation scoped to the map container.

- [ ] **Step 6: Add accuracy disclosure UI**

Show `표시 N곳 · 미확인 N곳`, mark approximate points as `근사 위치`, expose source links in the selected-marker panel, and add a native disclosure listing unresolved labels and counts. Keep OpenStreetMap attribution in its own row.

- [ ] **Step 7: Review Task 3**

Trace props from `page.tsx` through `ClanDetailClient` to `KoreaMap`; verify accessible button behavior, deterministic SSR values, map bounds, and marker modes. Fix issues and run tests and typecheck.

### Task 4: Data loading efficiency and historical-map correctness

**Files:**
- Modify: `src/app/clans/[id]/page.tsx`
- Modify: `src/components/ClanDetailClient.tsx`
- Modify: `src/components/KoreaMap.tsx`

**Interfaces:**
- Consumes: existing asynchronous repository methods and the map model.
- Produces: a clan detail page whose time filtering does not issue client network geocoding and whose map covers the entire peninsula.

- [ ] **Step 1: Inspect repository contracts and measure payload**

Confirm the exact `listExamRecords` return shape and calculate the serialized size of `allRows` for the largest clan. Record whether a reduced `{ year, residence }[]` projection is sufficient.

- [ ] **Step 2: Replace oversized client data where necessary**

Pass only the year and residence fields required for the time slider. Preserve current page table rows and repository caches.

- [ ] **Step 3: Verify viewport and tile calculation**

Check that the fixed center, zoom, and tile grid include Jeju through the northern Korean border at all supported component widths. Adjust map center and dimensions without changing marker coordinates.

- [ ] **Step 4: Review Task 4**

Dry-run a clan with many records, a North Korean bon-gwan, a missing bon-gwan, and both Yeongcheon residence variants. Fix integration and performance issues.

### Task 5: Full verification and integrated review

**Files:**
- Modify as required by discovered defects only.

**Interfaces:**
- Consumes: all prior tasks.
- Produces: verified production behavior and a final coverage report.

- [ ] **Step 1: Run automated verification**

Run: `npm.cmd test`

Run: `npm.cmd run typecheck`

Run: `npm.cmd run lint`

Run: `npm.cmd run build`

Run: `node scripts/audit-map-coverage.mjs`

Expected: all commands exit 0; audit totals balance and every input is classified.

- [ ] **Step 2: Run route checks**

Start `npx.cmd next dev -p 3000` detached with logs in `%TEMP%\opencode\dev3000.log`. Open representative clan detail routes for South Korean, North Korean, ambiguous, missing, and Hanja-collision cases.

- [ ] **Step 3: Inspect rendered behavior**

Confirm no hydration errors, correct marker locations, working marker modes and year slider, readable lower panel, visible uncertainty labels, valid source links, and intact mobile layout.

- [ ] **Step 4: Perform integrated code review**

Review requirements compliance, code style, stability, scalability, security, imports, signatures, data flow, Next.js 16.3 compatibility, and a manual dry run. Fix every issue and repeat all affected verification commands.

- [ ] **Step 5: Report evidence**

Report resolved/ambiguous/unknown unique values and weighted records separately for bon-gwan and residence, list remaining unknown reasons, link changed files, and state exact commands that passed.
