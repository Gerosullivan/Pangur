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

## 2. Pangur Special Sequencing (Move-Attack-Move / Attack-Move-Attack) ✅ COMPLETED

**Goal:** upgrade Pangur (`3/1` Strongpaw) to support two advanced action sequences per turn while respecting the existing single-move/single-attack limits for other cats.

**Implementation Status:** ✅ Complete

**What Was Implemented:**

1. **Type Extensions** (`src/types.ts`):
   - Added `PangurSequence` type: `'move-attack-move' | 'attack-move-attack'`
   - Extended `CatState` with three new fields:
     - `specialSequence?: PangurSequence` - Tracks which sequence Pangur is executing
     - `sequenceMoveCount: number` - Counts moves in the sequence (0-2)
     - `sequenceAttackStarted: boolean` - Tracks if attacks have begun

2. **Mechanics Updates** (`src/lib/mechanics.ts`):
   - Updated `createInitialGameState()` to initialize new sequence fields (all cats get these fields, only Pangur uses them)
   - Updated `resetCatTurnState()` to clear sequence state at turn start

3. **Game Logic** (`src/state/gameStore.ts`):
   - **`moveCat()` handler:**
     - Pangur can move up to 2 times (vs 1 for other cats)
     - First move without prior action → starts `'move-attack-move'` sequence
     - After attack in MAM → allows second move
     - In AMA sequence → allows 1 move after attacks
     - Regular cats unchanged (1 move only)
   - **`attackMouse()` handler:**
     - First attack without prior action → starts `'attack-move-attack'` sequence
     - Marks `sequenceAttackStarted` to enable subsequent moves
     - Pangur can continue attacking until catch is exhausted

4. **UI Updates** (`src/components/SidePanel.tsx`):
   - Added badge showing active sequence: `MAM` or `AMA`
   - Added sequence status text showing current step:
     - MAM: "Ready to move (1st)" → "Moved - Attack next" → "Attacked - Can move again" → "Completed"
     - AMA: "Attacked - Can move" → "Moved - Can attack (X catch left)"
   - Shows remaining catch points during sequences

**How Pangur's Sequences Work:**

1. **Move-Attack-Move (MAM):**
   - Move → Attack (all desired points) → Move again
   - Example: Move from B2 to C2, attack mice, then move to D2
   - Turn ends after second move or when player clicks End Turn

2. **Attack-Move-Attack (AMA):**
   - Attack → Move → Attack (remaining points)
   - Example: Attack from B2, move to C2, continue attacking with leftover catch
   - Can spend catch partially before and after moving

**Testing Notes:**
- TypeScript build passes with no errors
- Sequence state properly initialized and reset
- Regular cats (guardian, baircne) maintain original 1-move + 1-attack behavior
- UI clearly displays sequence progress

**Acceptance Criteria:** ✅
- ✅ Pangur can legally perform both special sequences (MAM and AMA)
- ✅ Other cats remain limited to one move + one attack batch (no regression)
- ✅ Sequence state is visible to players via badges and status text
- ✅ Sequence state resets correctly between turns via `resetCatTurnState()`
- ✅ Catch limits respected (total catch spent ≤ effective catch including shadow bonus)

