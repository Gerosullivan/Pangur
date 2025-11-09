# Upcoming Feature Work

This document captures near-term improvements queued up for the Pangur prototype. Each item should contain enough context for another engineer/agent to implement without rereading the entire spec.

## 1. Configurable Board Layout (Shadow / Meow / Gate Map)

**Goal:** enable developers to tweak board terrain modifiers (shadow bonus, entrance meow boost, etc.) without editing component code.

**Implementation Plan:**

- Introduce a JSON (or TS) map file (e.g. `src/data/boardLayout.json`) that enumerates each `CellId` (`A1`..`D4`) with its `terrain` tag. For the current prototype only three terrain values exist: `shadow` (+1 catch), `entrance` (was 'gate' - meow ×2), and `normal`.
- Replace hardcoded logic in `src/lib/board.ts` (`isShadowBonus`, `terrainForCell`, meow lane calculations) so that terrain metadata is read from this external file at build time. Row-based meow multipliers should still apply (row 4 & 3 = ×1 unless marked `entrance`, row 2 = ×0.5 floored, row 1 = 0).
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

## 2. Guardian Synergy Aura (2/2 Cat Stat Borrowing) — ✅ Implemented

> ✅ Baircne now scans the eight adjacent cells each frame. For every nearby ally he copies that cat’s dominant stat: Pangur grants +1 catch, the Guardian (`1/3`) grants +1 meow, and having both adjacent grants both bonuses. Aura bonuses are applied before lane/shadow modifiers and vanish instantly when the formation breaks.

**Behaviour Highlights:**

- Aura bonuses stack with terrain (shadow, gate). Example: Pangur neighbor + shadow lane yields `2 base +1 aura +1 shadow = 4` catch, while Guardian neighbor + gate lane yields `(2 base +1 aura) ×2 = 6` meow.
- Deterministic: each stat can gain at most +1 regardless of how many cats share the same dominant attribute.
- UI surfacing:
  - Side panel shows `Aura +1 Catch/Meow` badges whenever active and names the contributing cat inside the breakdown text (“+1 aura (Pangur)”).
  - Cat pieces inherit the boosted stats automatically, so attack ranges and deterrence previews always match the aura-enhanced numbers.

**Testing Notes:**

- Verify adjacency in all eight directions, including diagonals, and ensure bonuses drop immediately once the supporting cat moves or is removed.
- Confirm deterrence recalculations and remaining catch tracking account for the aura (e.g., Guardian gains the extra catch point to spend during the same turn).
