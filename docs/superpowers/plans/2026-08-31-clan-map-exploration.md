# Clan Map Exploration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make clan detail maps interactive and filterable so users can distinguish bon-gwan from residences and inspect how locations change by historical period.

**Architecture:** Keep the existing server-fetched `ClanDetail` data contract. Add a focused client-side map controller that derives visible residence markers from the selected mode and year range, while preserving the existing OpenStreetMap tile projection and anime.js marker entrance animation. Add the period filter as shared state in the clan detail client and pass filtered records to the map and existing summary sections.

**Tech Stack:** Next.js 16.3 App Router, React 19, TypeScript strict, OpenStreetMap tiles, anime.js, Tailwind CSS 4.

**Spec:** Approved chat brief: marker click details, bon-gwan/residence visibility toggle, and a king/year period slider on the clan detail map.

## Global Constraints

- Preserve the existing `ClanDetail` and repository interfaces.
- Dynamic route/search params remain Promise-based; do not change route contracts.
- Use the existing `--accent` palette and avoid gradients, glow, pill spam, or decorative markers.
- Keep `anime.js` for marker entrance motion; motion must be short and non-springy.
- Keep OpenStreetMap attribution visible.
- Run `npm.cmd run typecheck` and targeted ESLint after each task.

---

### Task 1: Make map markers inspectable and mode-aware

**Files:**
- Modify: `src/components/KoreaMap.tsx`
- Modify: `src/components/ClanDetailClient.tsx`

**Interfaces:**
- `KoreaMap` receives `markerMode: "all" | "bonGwan" | "residences"` and `selectedPeriod?: { start: number; end: number }`.
- Marker click exposes a local selected marker panel with place name, count, and marker type.

- [ ] Add a failing interaction test or a deterministic helper assertion for marker-mode filtering.
- [ ] Run the available test command and confirm the new assertion fails before implementation.
- [ ] Implement mode filtering, click selection, and an accessible details panel in `KoreaMap`.
- [ ] Preserve the existing Web Mercator projection and anime.js entrance animation.
- [ ] Run `npm.cmd run typecheck` and `npx.cmd eslint src/components/KoreaMap.tsx src/components/ClanDetailClient.tsx`.

### Task 2: Add bon-gwan/residence toggle controls

**Files:**
- Modify: `src/components/KoreaMap.tsx`

**Interfaces:**
- Toggle controls set `markerMode` and expose `aria-pressed` state.
- Bon-gwan remains a single accent marker; residence markers remain neutral/size-encoded.

- [ ] Add a failing DOM assertion for the default mode and the two alternate labels.
- [ ] Run the available test command and confirm it fails for the missing controls.
- [ ] Add compact text controls above the map without introducing decorative pill badges.
- [ ] Ensure keyboard focus and screen-reader names describe each mode.
- [ ] Run targeted ESLint and typecheck.

### Task 3: Add historical period range filtering

**Files:**
- Modify: `src/components/ClanDetailClient.tsx`
- Modify: `src/components/KoreaMap.tsx`

**Interfaces:**
- `ClanDetailClient` owns `periodRange` state based on available exam years.
- `KoreaMap` receives filtered residence counts and the selected range label.

- [ ] Add a failing assertion for a selected range label and filtered marker count.
- [ ] Run the available test command and confirm it fails before implementation.
- [ ] Add a native range control with explicit year labels and a reset action.
- [ ] Recompute residence counts from the clan's exam rows for the selected range without changing repository APIs.
- [ ] Keep map, caption, and visible range synchronized; avoid random/date-dependent rendering.
- [ ] Run `npm.cmd run typecheck`, targeted ESLint, and a local route smoke check.

### Verification

- [ ] Capture the clan detail route with the map in default, bon-gwan-only, residence-only, and narrowed-period states.
- [ ] Confirm OpenStreetMap tiles, marker positions, labels, and attribution render without hydration warnings.
- [ ] Run the full lint command and report any pre-existing errors outside the touched files.
