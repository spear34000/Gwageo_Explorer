# Clan Detail Performance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep the clan detail page behavior unchanged while removing avoidable sequential work and preventing exam filters from truncating the map/timeline dataset.

**Architecture:** Preserve the existing `src/app/clans/[id]/page.tsx` server-component contract and `DataRepository` API. Add one focused repository helper for unpaginated clan rows so the page can fetch detail data, filtered table rows, full map rows, and clan locations in parallel, then scope client-side anime.js selectors to the detail root to avoid document-wide DOM scans.

**Tech Stack:** Next.js 16.3 App Router, React 19, TypeScript strict, node:test via `tsx --test`, anime.js, Prisma 7.9/SQLite.

**Spec:** Approved task brief from 2026-09-01: parallelize safe clan detail reads, keep map/year counts complete under exam filters, preserve URL/filter behavior, and constrain animation queries to the detail root.

## Global Constraints

- Read the relevant Next.js 16.3 docs before editing App Router code.
- Dynamic `params` and `searchParams` remain Promise-based; preserve current decoding and query behavior.
- Do not recompute expensive clan summaries outside the repository caches.
- Follow TDD for behavior changes: failing regression test first, then minimal implementation.
- No commits or history rewrites; work on top of the dirty tree carefully.

---

### Task 1: Add regression coverage for filtered map-row truncation

**Files:**
- Modify: `src/lib/data/clan-research.test.ts`
- Inspect: `src/lib/data/repository.ts`

**Interfaces:**
- Add a test against `repository.listExamRecords(...)` behavior or a new repository helper that proves map rows still include every clan record when the page table is filtered by exam type.
- Keep assertions on real returned row data and totals, not mocks.

- [ ] Write one failing regression test that models a clan with more total rows than filtered rows.
- [ ] Run `npm.cmd test -- src/lib/data/clan-research.test.ts` and confirm the new test fails for the expected truncation reason.
- [ ] Review the test name and assertions to ensure they describe the user-visible bug.

### Task 2: Implement the minimal server/repository fix and scope DOM queries

**Files:**
- Modify: `src/lib/data/types.ts`
- Modify: `src/lib/data/repository.ts`
- Modify: `src/app/clans/[id]/page.tsx`
- Modify: `src/components/ClanDetailClient.tsx`

**Interfaces:**
- `DataRepository` adds one method for retrieving all exam rows for a clan without pagination side effects.
- `ClanDetailPage` starts independent detail reads before awaiting them together.
- `ClanDetailClient` keeps the same rendered sections/props while querying animation targets from a local root ref instead of `document`.

- [ ] Add the smallest repository API needed to fetch complete clan rows for the map dataset.
- [ ] Update both repository implementations to support the new method without changing existing filter semantics.
- [ ] Change the detail page to initiate safe independent reads first and await them with `Promise.all`.
- [ ] Scope anime.js selectors with a root ref and preserve the current animation timing and visuals.
- [ ] Run the focused test again and confirm it passes.
- [ ] Review touched code for requirement compliance and integration correctness before broader verification.

### Task 3: Verify the integrated behavior and record evidence

**Files:**
- Create: `C:/Users/spear/project/spear_ex/.superpowers/sdd/detail-perf-report.md`

**Interfaces:**
- Report must list changed files and the exact results of focused/full verification commands.

- [ ] Run `npm.cmd test -- src/lib/data/clan-research.test.ts`.
- [ ] Run `npm.cmd test`.
- [ ] Run `npm.cmd run typecheck`.
- [ ] Run `npm.cmd run lint`.
- [ ] Run `npm.cmd run build`.
- [ ] Summarize changed files and exact command outputs in the report file.
- [ ] Perform a final integrated code review across the touched files and note any remaining TODOs if user input would be required.
