# Pangur - turn based strategy game Spec

This document captures the design for the new Pangur prototype. Keep this spec current as features land in the new repo.

## 1. Core Concept

- Setting: Cats defend a 5x5 building grid from waves of mice. Each cell may hold exactly one resident (cat or mouse piece) or remain empty.
- Coordinates: Columns `A-E` (left->right) and rows `1-5` (bottom->top), chess style.
- Orientation: Row `5` (top) is the building entrance; row `1` (bottom) is the back wall.
- Goal: Survive by eliminating resident mice and deterring the incoming queue before grain or cats are lost.

## 2. Starting State

- Board: 5x5 grid representing the building interior. All perimeter cells render as `shadow` terrain except the three open gates at `B5`, `C5`, `D5`. No mice begin on the perimeter; the only residents at start are the cats in hand. The board layout is fully data-driven via `src/data/boardLayout.json`, which defines each cell’s `terrain` plus optional `entry` metadata (`direction: north/south/east/west`, `incomingMice`). Entry cells no longer create per-edge staging bands; instead, their metadata informs the single shared queue described in §8.
- Cat pieces: Three residents off-board at the bottom center, displayed side-by-side (same cat component as will be on board - see UI spec). Base stats use `catch/meow`: `1/3`, Pangur (aka Cruibne) `3/1`, `2/2`. Each cat begins with five hearts (health).
- Setup placement: Before the standard turn loop begins, the player performs a single setup phase, dragging each cat piece from the off board onto any free interior cell (non-gate). This occurs once per game. After placing all three cats, the player must confirm their starting formation before entering the normal turn loop.
- Grain: 16 units stored inside the building.
- Incoming Wave: Six mouse pieces max per wave. They live in a single shared staging lane UI that shows total incoming, total meow deterrence (“Meowge”), and how many will enter this turn based on current cat placement.

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
   - Calculate meow deterrence from cats standing on gate cells only (§8). Sum their meow to generate the turn’s “Meowge” value, subtracting directly from the six-mouse cap. The shared staging UI updates in real time with the deterred/entering counts.
   - If Meowge ≥ incoming, all mice flee and the phase immediately ends.
   - Otherwise, spawn the remaining mice by processing each gate’s “mouse line”: start on the gate cell, walk straight inward (orthogonal, no diagonals) until reaching a blocking cat or the board edge, and collect the open cells along that line. Place new mice on those cells in order, preferring tiles marked as `shadow` so they can upgrade next turn; if multiple shadows exist, choose the closest to the gate, else fall back to the earliest open tile in the line. Skip any gate fully blocked by a cat.
   - If the board lacks legal cells for all required entrants, trigger the “Building overwhelmed” loss condition.
   - Apply the stepper control so deterrence and each placement require explicit user progression.

## 5. Cat Phase Details

- **Activation**
  - Player selects a cat to make it active (highlight border). Only the active cat can spend catch points or move.
- **Ordering Rules**
  - Each cat may move once per turn and spend catch either before or after that move. If a cat attacks first, it may still take its single move afterwards.
  - Pangur exception: Pangur receives two queen-style moves per turn. He may use them before attacking, after attacking, or split on both sides of a single attack sequence, but cannot chain more than two total moves.
  - Shadow Strike bonus: when a cat begins its first attack of the turn while standing on a shadow tile, it gains +1 temporary catch for that attack sequence. Leaving the shadow tile before starting the attack removes this bonus.
  - Players may swap between cats freely; switching away remembers how many moves/catch the previous cat has remaining.
  - **Guardian Aura (Baircne `2/2`):** Whenever Baircne is adjacent (orthogonal or diagonal) to another friendly cat, he copies that cat’s stronger attribute: +1 Catch if the neighbor’s catch exceeds their meow, or +1 Meow if their meow is higher. Each stat can only gain +1 per turn (so Pangur + Guardian neighbors grant +1 Catch *and* +1 Meow if both are adjacent). Aura bonuses recalculate immediately as formations shift and stack with terrain modifiers (shadow strike, gates).
- **Attacking**
  - Valid targets: Adjacent and diagonal resident mice (max 8 surrounding cells).
  - Spending 1 catch deals 1 damage. Cats may keep spending while they have remaining catch.
  - Shadow Strike bonus adds +1 catch to the first attack sequence only if it was initiated while standing on a shadow tile.
  - Surviving mice become stunned (skip their next activation) and immediately retaliate for `max(mouse effective attack − cat effective meow, 0)` hearts. Pangur’s adjacency aura (see §6) increases a `2/2` mouse’s effective attack by +1 before this calculation.
  - On killing a mouse, the cat heals +1 heart (cannot exceed 5 hearts).
  - Mice that survive the entire turn heal back to their max hearts during cleanup; UI shows persistent hearts to indicate partial damage.
- **Movement**
  - All cats move like chess queens: any number of cells vertically, horizontally, or diagonally until blocked by a resident or board edge; they cannot pass through other residents.
  - Pangur alone may perform two independent queen moves per turn (see Ordering Rules); other cats still receive only one.
  - Drop commits the move and updates deterrence + shadow/meow status immediately.
- **Turn End**
  - `End Turn` finalizes cat actions, triggers meow calculation, and hands off to the mouse phase.
  - No special sequencing UI is required now that Pangur’s double-move is automatic; end turn is always available once every cat has either acted or been skipped manually.

## 6. Resident Mouse Phase

- **Phase 1 – Move or Attack**
  - Iterate every unstunned, on-board mouse in reading order (top row to bottom, left to right). A stunned mouse skips the entire phase.
  - If a cat occupies one of the eight adjacent cells (orthogonal or diagonal), the mouse attacks instead of moving, spending all of its attack points as 1-heart hits using the targeting priority below. Otherwise, it attempts to move.
  - Targeting priority (re-evaluate after each hit):
    1. Cat with base stat `1/3`.
    2. Any cat in row `4` or `5` (closest to the gates), breaking ties left→right.
    3. Remaining cats sorted by lowest current hearts, then left→right.
  - Movement: a mouse may travel up to `attack` tiles per turn using only orthogonal steps. Choose a destination path that trends toward the nearest shadow tile first; if multiple options exist, prefer the path that keeps the mouse inside a gate’s column so it can continue along that line next turn. Mice cannot move through cats but may pass through fellow mice if the intermediate cell vacates earlier in the same phase.
  - Pangur aura: any `2/2` mouse adjacent (orthogonal or diagonal) to Pangur temporarily gains +1 attack for damage rolls this phase (also increases its maximum move distance).
- **Phase 2 – Feed / Upgrade**
  - Resolve only for mice not stunned and still alive.
  - Every mouse consumes grain equal to its current tier (1 for base, 2 for `2/2`). If grain hits zero at any point, trigger the loss condition immediately.
  - Mice on shadow tiles upgrade +1/+1 (from `1/1` to `2/2`) after eating. Mice off shadow tiles merely sustain themselves at their current stats.
  - Grain-fed `2/2` mice that are not on shadow tiles stay `2/2` but do not exceed those stats.
- **Phase 3 – Cleanup**
  - Remove the stunned flag from every surviving mouse and heal all of them back to their max hearts (1 or 2).
  - Log summary text for clarity before transitioning into the Incoming Wave stepper.

## 7. Incoming Wave Phase

- **Shared Queue + Live Preview**
  - A single staging lane shows up to six incoming mice. During the cat phase it displays three values: total queued, total Meowge (live meow sum from gate cats), and how many will enter if the player ended the turn immediately.
  - Cat moves update Meowge in real time. If Meowge exceeds the queued amount, the preview shows only 😱 icons to indicate a fully deterred wave.
- **Deterrence Calculation**
  - At phase start, clamp entrants to `max(queued - Meowge, 0)`. Remove deterred mice from the queue and show them fleeing via 😱 icons plus a log line.
- **Placement Algorithm**
  - Process gates left-to-right (`B5`, `C5`, `D5`). Skip a gate entirely if a cat currently occupies it (that cat already contributed Meowge and is blocking the entrance).
  - For each gate, build its mouse line: begin on the gate cell, then step straight south (toward row `1`) until reaching the board edge or a blocking cat. Collect all unoccupied cells along that line.
  - Rank the candidate cells for that gate by:
    1. Shadow terrain first (closest to the gate wins ties).
    2. Remaining cells in gate-line order (closest to the gate first).
  - Place entering mice by consuming the ranked cells from the gate currently being processed before moving to the next gate. Continue cycling through gates until all entrants are placed or no legal cells remain.
  - If the algorithm cannot place all required mice (e.g., every mouse line is blocked by cats), trigger the “Building overwhelmed” loss immediately.
- **Stepper Presentation**
  - Frame order: summary of Meowge, one frame per scared mouse leaving the queue, then one frame per placement describing gate + destination.
  - Final frame increments the wave counter, refills the queue back to six default mice, and returns control to the cat phase.

## 8. Special Cells & Modifiers

- **Board Layout JSON**
  - `src/data/boardLayout.json` enumerates every cell with a `terrain` tag (`shadow`, `gate`, `interior`) and optional `entry` block. Entry metadata captures `direction` (`north`, `south`, `east`, `west`) and the number of mice queued outside that perimeter cell on turn 1.
  - The loader validates that entry cells live on the perimeter and that their direction matches the side they touch; invalid layouts fail fast at build time.
  - UI + gameplay both hydrate directly from this file: updating `incomingMice` immediately changes the shared queue sizing and gate-line placement targets with no code changes.

- **Meow Zones**
  - Only the open gates `B5`, `C5`, and `D5` emit meow. A cat must stand on one of these cells for its meow value to count toward Meowge; there are no longer doubled or ring zones.
  - Meow numbers render with a blue glow when active. Cats off-gate show greyed/disabled meow stats to reinforce that they contribute zero deterrence.
- **Shadow Bonus (Catch)**
  - All outer-ring tiles (row `1`, row `5`, column `A`, column `E`) are marked `shadow` except the three gate cells above.
  - Cats obtain the +1 Shadow Strike bonus only if they initiate their first attack of the turn while standing on any shadow tile. The bonus is not tied to the start of turn anymore; it depends on the cell where the attack begins.
  - UI: cat catch number glows red while Shadow Strike is primed.
  - UI: cat catch number bold with red glow while the bonus is active; render these shadow bonus cells darker so the player can plan formations.

## 9. Resource & State Tracking

- Track per-cat: position (or hand slot), hearts, base catch/meow, temporary modifiers, spent catch, move-used flag.
- Track per-mouse: position, current stats (`1/1` or `2/2`), stun flag.
- Track global: grain total, single incoming queue (ordered list of upcoming mice), turn counter, and the deterrence preview object (`meowge`, `incoming`, `deterred`, `entering`).

## 10. Win & Loss Conditions

- **Win**: No resident mice on board and the incoming queue is empty when the wave would spawn.
- **Loss**
  - Grain reaches 0 at any time.
  - Any cat is killed (instant defeat, even if others survive).
  - Incoming mice cannot be placed due to lack of free cells (board overwhelmed).
  - Resident mice occupy every interior cell simultaneously.
  - A mouse successfully upgrades to `7/7` (future-proofed capstone threat that cats cannot remove).

## 11. Open Questions

- Lock in the exact heuristic for mouse movement targeting (current plan favors nearest shadow tiles on their gate lines—tweak as we playtest).
- Decide how much animation/pacing polish to add for incoming placement given the single staging lane.
- Confirm which optional controls (undo, restart) are still in scope for this iteration.
