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

## 2. Guardian Synergy Aura (2/2 Cat Stat Borrowing)

**Goal:** Give the `2/2` Guardian a tactical support role by letting him temporarily copy the stronger stat (catch or meow) from any adjacent/diagonal friendly cat, on top of existing terrain buffs.

**Behavioural Rules:**

- Aura radius: any of the eight neighboring cells (same footprint we use for attack adjacency). Multiple neighbors can exist, but only the single highest stat value among them is copied each turn.
- Copied stat logic:
  - Compare each nearby cat’s effective catch and effective meow (after their own terrain modifiers).
  - Identify the largest single attribute value among those neighbors; grant that to Guardian as a flat +1 bonus applied to the matching stat (catch or meow).
  - Shadow (+1 catch) or gate (×2 meow) bonuses apply *after* the aura. Example: Guardian next to Pangur in a shadow cell becomes base 2 catch +1 aura +1 shadow = 4.
  - If multiple neighbors tie for best value but on different stats, prefer catch (offense priority) unless we explicitly decide otherwise later.
- Bonus refreshes dynamically as formations change; leaving adjacency removes it immediately.

**Implementation Outline:**

- Extend `getCatEffectiveCatch` / `getCatEffectiveMeow` to accept an optional `includeGuardianAura` flag or compute Guardian separately to avoid circular lookups.
- Board/UI:
  - Show a new badge (“Aura +1 Catch/Meow”) on Guardian when active.
  - Include helper text in the side panel breakdown (e.g., “+1 aura from Pangur”).
  - Consider a subtle glow on neighbor cells when Guardian is selected to teach the mechanic.
- Mechanics:
  - Re-run deterrence and remaining catch calculations whenever adjacency changes so previews stay accurate.
  - Ensure stacking works with existing modifiers (shadow, gate, Pangur sequencing) and cannot exceed caps like heart limits.

**Acceptance Criteria:**

- Guardian gains +1 to either catch or meow whenever at least one neighboring friendly cat has a strictly higher value in that stat; stacks with terrain bonuses.
- Removing adjacency or knocking out the source cat immediately removes the aura.
- Side panel and badges make it obvious which stat is currently buffed and why.
