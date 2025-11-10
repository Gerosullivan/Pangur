# Pangur - turn based strategy game Spec

This document captures the design for the new Pangur prototype. Keep this spec current as features land in the new repo.

## 1. Core Concept

- Setting: Cats defend a 4x4 building grid from waves of mice. Each cell may hold exactly one resident (cat or mouse piece) or remain empty.
- Coordinates: Columns `A-D` (left->right) and rows `1-4` (bottom->top), chess style.
- Orientation: Row `4` (top) is the building entrance; row `1` (bottom) is the back wall.
- Goal: Survive by eliminating resident mice and deterring the incoming queue before grain or cats are lost.

## 2. Starting State

- Board: 4x4 grid representing the building interior. Perimeter cells (row 4, row 1, column A, column D) begin occupied by resident `1/1` mice pieces, filling all edge squares (12 total); interior cells start empty. Shadow bonus cells should render dark, while open gate cells appear light (B4, C4). The board layout is fully data-driven via `src/data/boardLayout.json`, which defines each cell’s `terrain` plus optional `entry` metadata (`direction: north/south/east/west`, `incomingMice`). Entry cells automatically render staging divs outside the matching board edge to hold their queue of emoji mice.
- Cat pieces: Three residents off-board at the bottom center, displayed side-by-side (same cat component as will be on board - see UI spec). Base stats use `catch/meow`: `1/3`, Pangur (aka Cruibne) `3/1`, `2/2`. Each cat begins with five hearts (health).
- Setup placement: Before the standard turn loop begins, the player performs a single setup phase, dragging each cat piece from the off board onto any free interior cell. This occurs once per game; cats cannot be placed on occupied perimeter cells until cleared. After placing all three cats, the player must confirm their starting formation before entering the normal turn loop.
- Grain: 16 units stored inside the building.
- Incoming Wave: 12 mouse pieces waiting outside, split per entry cell as configured in `boardLayout.json` (current default: 6 for `B4 north` and 6 for `C4 north`). UI shows one staging band per entry directly outside the corresponding perimeter cell so the player can see how many mice are queued on each side.

## 3. Attributes & Terminology

- `Catch (Paw)`: Attack points. One point spends to deal 1 damage to a target mouse.
- `Meow`: Deter value. Sum of all active meow determines how many mice from the incoming wave flee each end of turn.
- `Hearts`: Cat / mouse health. When a cat or mouse reaches 0 hearts it is removed.
- `Stunned (mouse only)`: Mouse skips its attack/eat actions for the rest of the current turn cycle.
- Mouse stat formats: `1/1` (attack/health base) or `2/2` (attack/health after grain).
- `Nearest` (adjacent): Any cell that shares an edge **or** a corner with the origin cell (orthogonal or diagonal). This definition applies to cat/mouse attack ranges, aura checks, and terrain effects that reference “closest” cells (e.g., gate meow zones).

## 4. Turn Loop Overview

After the one-time setup placement, each round repeats these phases in order:

1. **Cat Phase**
   - Begins only after the player confirms the initial cat placement.
   - For each cat (any order), player resolves optional movement and attacks, adhering to the locking rules below.
   - Player ends phase by triggering `End Turn`.
   - Ending this phase hands control to the stepper UI that reveals subsequent phases frame-by-frame.
2. **Resident Mouse Phase**
   - Mice on the board attack based on priority rules and remaining attack points.
   - Surviving mice eat grain, potentially evolving.
   - Every meaningful state update (target selection, damage, eating, stat changes) pauses until the player advances with the stepper control.
3. **Incoming Wave Phase**
   - Calculate meow deterrence per entry cell (see §8). Each cat’s meow is assigned to the nearest entry cell(s) using Chebyshev distance; ties split evenly and any remainder is distributed deterministically left-to-right. This produces a `meow` bucket for every entry, which drives both the UI labels (“Meow Deterring: X”) and the scare counts.
   - Remove scared mice from each entry’s queue independently (`deterred = min(bucket, queued)`), updating the staging bands so players can watch mice flee from specific gates.
   - After deterrence, place the remaining mice by pulling from each entry queue in order (north → east → south → west), spawning them onto the highest available rows just like the earlier prototype. If the board lacks free cells for the required entrants, trigger the “Building overwhelmed” loss condition.
   - Apply the same stepper control so each placement or deterrence change requires explicit user progression.

## 5. Cat Phase Details

- **Activation**
  - Player selects a cat to make it active (highlight border). Only the active cat can spend catch points or move.
- **Ordering Rules**
  - Each cat takes at most one move and one attack sequence per turn. The player may either move first (then start attacking) or attack first (then take the single move), but cannot move both before and after attacking.
  - Once a cat begins attacking, it must finish spending catch before moving. If it moves first, it may attack afterwards; if it moves after attacking, that move ends its turn.
  - Players may swap between cats freely; switching to another cat does not reset the ordering restriction on the original cat.
  - Example: Pangur attacks to clear a path, the `2/2` cat moves into the new space and attacks, then Pangur spends remaining catch before choosing to move at the end of its own sequence.
  - **Pangur exception:** Pangur may execute exactly one of two special sequences each turn: Move→Attack→Move (`MAM`) or Attack→Move→Attack (`AMA`). The first action picked locks in the sequence. `MAM` grants a second queen-style move after his attack leg; `AMA` lets him split his catch spends around a single move. He may finish early at any point, but forfeits any remaining legs for that turn.
  - **Guardian Aura (Baircne `2/2`):** Whenever Baircne is adjacent (orthogonal or diagonal) to another friendly cat, he copies that cat’s stronger attribute: +1 Catch if the neighbor’s catch exceeds their meow, or +1 Meow if their meow is higher. Each stat can only gain +1 per turn (so Pangur + Guardian neighbors grant +1 Catch *and* +1 Meow if both are adjacent), the aura recalculates immediately as formations shift, and these bonuses stack with terrain modifiers (shadow, gate, etc.).
- **Attacking**
  - Valid targets: Adjacent and diagonal resident mice (max 8 surrounding cells).
  - Spending 1 catch reduces the target mouse health by 1.
  - When a `2/2` mouse is hit but survives, downgrade it to `1/1` and mark it stunned; the mouse loses its bonus attack and health and cannot act again this turn.
  - On killing a mouse, the cat heals +1 heart (cannot exceed 5 hearts).
  - Paw points do not refresh mid-turn; once spent, they are gone until next round.
- **Movement**
  - Pangur (`3/1`) moves like a chess queen: any number of cells vertically, horizontally, or diagonally until blocked by a resident or board edge; cannot pass through mice.
  - Other cats move like a chess king: one cell in any direction per move, provided the destination is free; they cannot move through or over mice.
  - Drop commits the move and updates any derived attributes immediately.
- **Turn End**
  - `End Turn` finalizes cat actions, triggers meow calculation, and hands off to the mouse phase.
  - While Pangur has an incomplete `MAM`/`AMA` sequence, `End Turn` stays disabled until he executes the remaining leg or the player taps the side-panel control to finish the sequence early.

## 6. Resident Mouse Phase

- **Attack Sub-phase**
  - Each mouse spends all attack points before moving to the next mouse; skip any mouse flagged as stunned.
  - Attack range: mice may only strike cats occupying one of the eight adjacent cells (orthogonal or diagonal). If no adjacent cat is available when their turn arrives, that mouse skips its attacks.
  - Targeting priority (re-evaluate after each hit):
    1. Cat with base stat `1/3` (if alive).
    2. Any cat in row `4` (closest to the building entrance). Break ties left->right then lowest column letter.
    3. Remaining cats sorted by lowest current hearts, then left->right.
  - Each point of mouse attack deals 1 heart damage. Cats reaching 0 hearts are removed immediately.
  - Cats cannot be stunned.
- **Attack Presentation Stepper**
  - When this phase begins, freeze the board state and show a stepper UI with `Next` control.
  - Initial frame highlights the active mouse and its target cat before damage is applied (both pieces gain a red border/glow while the frame is active).
  - Pressing `Next` resolves one attack point, updates hearts, and logs the damage; subsequent presses cycle to the next remaining attack point or next mouse.
  - Continue stepping until all resident mouse attacks are resolved; this sequencing doubles as deterministic playback for automated test harnesses.
- **Eat Sub-phase**
  - Resolve only for mice not stunned and still alive.
  - Base `1/1` mice consume 1 grain; immediately transform into `2/2`.
  - Grain-fed `2/2` mice consume 2 grain (stay `2/2`).
  - If grain is reduced to 0 during this phase, trigger the loss condition immediately.
- **Eat Presentation Stepper**
  - After the attack sub-phase concludes, present a summary frame showing all surviving mice preparing to eat.
  - Each `Next` press resolves one batch of eating actions: decrease grain, show consumption FX, then update upgraded mice stats (e.g., reveal `2/2`).
  - Final frame confirms the updated board state before moving on.

## 7. Incoming Wave Phase

- **Deterrence Calculation**
  - Sum current meow after special cell modifiers.
  - Remove that many mice from the front of the incoming queue (show "scared" state on mouse piece art).
- **Live Predictive Meow Impact**
  - During the cat phase, the incoming queue displays a real-time preview of deterrence effects.
  - Scared mice (those that will be deterred) appear as 😱 emoji, positioned slightly higher than regular mice.
  - Regular mice (those that will enter) appear as 🐭 emoji.
  - The display updates dynamically as cats move around the board and meow modifiers change.
  - Shows "Deterring: X mice" to indicate current total meow effect.
  - Calculation: scared = min(total meow, incoming queue); entering = incoming queue - scared.
- **Placement**
  - Step 1: Calculate total meow deterrence at the start of this phase and determine exactly how many mice will enter (entering = incoming queue - deterred).
  - Step 2: Delete all deterred (scared 😱) mice from the incoming queue display.
  - Step 3: Place each remaining mouse onto the board one at a time. **CRITICAL**: Only place the calculated number of entering mice, not the entire original queue.
  - Placement order: Fill from row `4` columns `A->D`, then row `3`, etc., filling empty cells top-down, left-to-right.
  - Stop when either all entering mice are placed or the board has no free cells.
  - If not all entering mice can be placed (board overwhelmed), trigger loss condition immediately.
  - After all mice are placed, refill the queue to 12 for preview of the next wave. Waves consistently supply 12 incoming mice in this prototype.
- **Incoming Wave Presentation Stepper**
  - Upon entering this phase, retain the stepper UI so each deterrence outcome and mouse placement requires an explicit `Next` input.
  - Frame order: show deterrence total, then each scared mouse popping off the queue, followed by individual placements onto the grid.
  - Provide clear textual callouts for automated testers (e.g., "Queue reduced to 7", "Placed mouse at B4").
  - Final frame previews the refreshed queue and hands control back to the cat phase setup for the next round.

## 8. Special Cells & Modifiers

- **Board Layout JSON**
  - `src/data/boardLayout.json` enumerates every cell with a `terrain` tag (`shadow`, `gate`, `interior`) and optional `entry` block. Entry metadata captures `direction` (`north`, `south`, `east`, `west`) and the number of mice queued outside that perimeter cell on turn 1.
  - The loader validates that entry cells live on the perimeter and that their direction matches the side they touch; invalid layouts fail fast at build time.
  - UI + gameplay both hydrate directly from this file: updating `incomingMice` immediately changes the staging bands, queue refill targets, and deterrence math with no code changes.

- **Meow Zones**
  - `B4` and `C4` (yellow gate cells) double meow (UI: cat meow number bold with blue glow).
  - Cells nearest to those gates (using the `Nearest` definition above) — `A4`, `D4`, `B3`, `C3`, `A3`, and `D3` — allow normal meow (no multiplier).
  - Every other board cell suppresses meow entirely (UI: cat meow number greyed/disabled).
- **Shadow Bonus (Catch)**
  - Perimeter cells — entire row `1` plus columns `A` and `D` across all rows — grant +1 catch.
  - Exceptions: `B4` and `C4` are "open gate" and provide no bonus.
  - Bonus eligibility is captured at the **start of each cat phase**: a cat must begin its turn on a shadow cell to gain +1 catch. Moving across shadow cells preserves the bonus, but stepping onto a non-shadow cell removes it for the remainder of that cat’s turn (even if they return to shadow later).
  - UI: cat catch number bold with red glow while the bonus is active; render these shadow bonus cells darker so the player can plan formations.

## 9. Resource & State Tracking

- Track per-cat: position (or hand slot), hearts, base catch/meow, temporary modifiers, spent catch, move-used flag.
- Track per-mouse: position, current stats (`1/1` or `2/2`), stun flag.
- Track global: grain total, per-entry incoming queues (maps `CellId -> MouseState[]`), turn counter, and the deterrence preview object (`totalMeow`, `scared`, `entering`, plus per-entry breakdown).

## 10. Win & Loss Conditions

- **Win**: No resident mice on board and the incoming queue is empty when the wave would spawn.
- **Loss**
  - Grain reaches 0 at any time.
  - All cats defeated.
  - Incoming mice cannot be placed due to lack of free cells (board overwhelmed).

## 11. Open Questions

- Decide whether live deterrence previews during drag are part of the first prototype or a later polish pass.
- Determine animation pacing (if any) for showing deterred mice leaving the queue and for mouse placement.
- Confirm which optional controls (undo, restart) are in scope for the reset prototype.
