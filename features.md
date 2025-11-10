# Upcoming Feature Work

This document captures near-term improvements queued up for the Pangur prototype. Each item should contain enough context for another engineer/agent to implement without rereading the entire spec.

## 1. Configurable Board Layout (Shadow / Meow / Gate Map)

**Goal:** enable developers to tweak board terrain modifiers (shadow bonus, entrance meow boost, etc.) without editing component code.

**Implementation Plan:**

- Introduce a JSON (or TS) map file (e.g. `src/data/boardLayout.json`) that enumerates each `CellId` (`A1`..`D4`) with its `terrain` tag. For the current prototype only three terrain values exist: `shadow` (+1 catch), `entrance` (was 'gate' - meow ×2), and `normal`.
- Replace hardcoded logic in `src/lib/board.ts` (`isShadowBonus`, `terrainForCell`, meow zone calculations) so that terrain metadata is read from this external file at build time. Gate-based meow zones should still apply (gate cells = ×2, adjacent ring = normal, all other cells = 0).
  - Provide sensible defaults (shadow for row 1 + columns A/D, entrance on row 4, etc.) in the file so the current behaviour remains unchanged until edits.
  - Ensure the store / selectors stay fast by caching the parsed layout in memory rather than re-reading the file on every call.
- Update tooling/documentation:
  - Document the file structure and how to add new terrain types in `features.md` (this file) and/or `context/spec.md`.
  - Add a unit test (or at least a runtime assertion) that validates the layout defines all 16 cells exactly once to avoid typos.
- Allow future extensions (e.g. alternate board sizes) by keeping the loader generic: it should not assume 4×4 beyond validation.

**Acceptance Criteria:**

- Changing the external layout file should immediately update which cells render as shadow/gate/meow lanes without touching TS files.
- No hardcoded column/row checks remain for terrain modifiers other than fallback defaults if the map is missing.

> Note: completed features live in `features_archive.md`. See that file for the Pangur special sequencing notes that were just accepted.
