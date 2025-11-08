# Upcoming Feature Work

This document captures near-term improvements queued up for the Pangur prototype. Each item should contain enough context for another engineer/agent to implement without rereading the entire spec.

## 1. Configurable Board Layout (Shadow / Meow / Gate Map) ✅ COMPLETED

**Goal:** enable developers to tweak board terrain modifiers without editing component code.

**Implementation Status:** ✅ Complete

**What Was Implemented:**
- Created `src/data/boardLayout.ts` with a typed `cellTerrain` map defining all 16 cells (A1-D4)
- Terrain types: `'shadow'`, `'gate'`, `'interior'`
- Replaced hardcoded logic in `src/lib/board.ts` with imports from the layout file
- Re-exported functions (`isShadowBonus`, `isGate`, `terrainForCell`) for backward compatibility
- Added validation function that runs on module load to ensure all 16 cells are defined
- Layout is cached in memory (single module-level constant) for fast lookups

**How to Modify the Board Layout:**
1. Open `src/data/boardLayout.ts`
2. Edit the `cellTerrain` object to change terrain types for specific cells
3. Available terrain types:
   - `'shadow'`: Grants +1 catch bonus (currently: row 1 + columns A/D)
   - `'gate'`: Open entrance cells (currently: B4, C4)
   - `'interior'`: Standard cells with no modifiers
4. The validation function will throw an error at build time if any cells are missing or invalid
5. Changes take effect immediately on rebuild - no need to modify TS component code

**Future Extensions:**
- The system is designed to be generic and can support:
  - Additional terrain types (add to the `TerrainType` union in types)
  - Alternate board sizes (modify validation to accept different dimensions)
  - Dynamic layout loading (currently static for performance)

**Acceptance Criteria:** ✅
- ✅ Changing the external layout file updates terrain rendering without touching other TS files
- ✅ No hardcoded column/row checks remain for terrain modifiers
- ✅ Validation ensures all 16 cells are defined exactly once

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

