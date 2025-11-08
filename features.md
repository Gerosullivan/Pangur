# Upcoming Feature Work

This document captures near-term improvements queued up for the Pangur prototype. Each item should contain enough context for another engineer/agent to implement without rereading the entire spec.

## 1. Configurable Board Layout (Shadow / Meow / Gate Map)

**Goal:** enable developers to tweak board terrain modifiers without editing component code.

**Implementation Plan:**
- Introduce a JSON (or TS) map file (e.g. `src/data/boardLayout.json`) that enumerates each `CellId` (`A1`..`D4`) with its `terrain` tag: one of `shadow`, `gate`, `entrance`, `normal`, or future values.
- Replace hardcoded logic in `src/lib/board.ts` (`isShadowBonus`, `isGate`, `terrainForCell`) so that terrain metadata is read from this external file at build time.
  - Provide sensible defaults (shadow for row 1 + columns A/D, entrance on row 4, etc.) in the file so the current behaviour remains unchanged until edits.
  - Ensure the store / selectors stay fast by caching the parsed layout in memory rather than re-reading the file on every call.
- Update tooling/documentation:
  - Document the file structure and how to add new terrain types in `features.md` (this file) and/or `context/spec.md`.
  - Add a unit test (or at least a runtime assertion) that validates the layout defines all 16 cells exactly once to avoid typos.
- Allow future extensions (e.g. alternate board sizes) by keeping the loader generic: it should not assume 4×4 beyond validation.

**Acceptance Criteria:**
- Changing the external layout file should immediately update which cells render as shadow/gate/meow lanes without touching TS files.
- No hardcoded column/row checks remain for terrain modifiers other than fallback defaults if the map is missing.

## 2. Pangur Special Sequencing (Move-Attack-Move / Attack-Move-Attack)

**Goal:** upgrade Pangur (`3/1` Strongpaw) to support two advanced action sequences per turn while respecting the existing single-move/single-attack limits for other cats.

**Behavioural Rules:**
- Pangur may execute **one** of the following each turn:
  1. `Move → Attack (multi-point) → Move` — second move occurs after finishing all desired attacks from the first position.
  2. `Attack (partial) → Move → Attack (remaining points)` — he can spend a portion of his catch, relocate, and spend any leftover points.
- Constraints:
  - Total catch spent per turn remains capped at his effective catch (including shadow bonus).
  - Total move distance per leg follows his queen-like movement rules; cannot pass through occupied cells.
  - Sequence choice is locked once started (e.g., if he attacks first, he must follow the Attack-Move-Attack flow; no extra moves).
  - Second move cannot occur if the destination is blocked (standard validation).
- UI / UX updates:
  - Visual indicator (badge or tooltip in the side panel) showing which sequence is currently in progress (`MA` vs `AMA`).
  - Disable End Turn until Pangur completes the allowed legs (or the player explicitly ends early).
  - Provide inline helper text in the side panel explaining remaining moves/attacks for Pangur during his turn.

**Implementation Steps:**
- Extend `CatState` with Pangur-specific turn flags, e.g. `specialSequence?: 'move-attack-move' | 'attack-move-attack'` and `specialLeg: 'firstMove' | 'midAttack' | ...`.
- Update action handlers in `src/state/gameStore.ts`:
  - When the player issues the first action for Pangur, set the sequence type based on whether they moved or attacked first.
  - Allow a second move or attack only if Pangur’s current sequence permits it and the required leg hasn’t been consumed.
  - Reset sequence flags at the start of each cat phase (`resetCatTurnState`).
- Adjust UI components (`Board`, `SidePanel`, `ActionArea`) to reflect available actions (e.g., highlight valid move cells even after an attack if Pangur still owes a move).
- Add tests or manual checklist verifying both sequences under various scenarios (killing a mouse mid-sequence, being blocked by new spawns, etc.).

**Acceptance Criteria:**
- Pangur can legally perform both special sequences; other cats remain limited to one move + one attack batch.
- Sequence state is visible to players and resets correctly between turns.
- No regression in existing attack/move validation for other cats.

