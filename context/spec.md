# Pangur - turn based strategy game Spec

This document captures the design for the new Pangur prototype. Keep this spec current as features land in the new repo.

## 1. Core Concept

- Setting: Cats defend a 5x5 building grid from waves of mice. Each cell may hold exactly one resident (cat or mouse piece) or remain empty.
- Coordinates: Columns `A-E` (left->right) and rows `1-5` (bottom->top), chess style.
- Orientation: Row `5` (top) is the building entrance; row `1` (bottom) is the back wall.
- Goal: Survive by eliminating resident mice and deterring the incoming queue before grain or cats are lost.

## 2. Starting State

- Board: 5x5 grid representing the building interior. All perimeter cells render as `shadow` terrain except the three open gates at `B5`, `C5`, `D5`. Every perimeter cell begins occupied by a `1/1` mouse (configurable per `src/data/boardLayout.json`). Designers can change which perimeter tiles spawn mice by editing that file, but the default layout fills the entire ring. Entry metadata still drives the shared queue described in §8.
- Cat pieces: Three residents off-board at the bottom center, displayed side-by-side (same cat component as will be on board - see UI spec). Base stats use `catch/meow`: Pangur (aka Cruibne) `3/1`, Guardian `1/3`, Baircne `2/2`. Each cat begins with five hearts (health).
- Setup placement: Before the standard turn loop begins, the player performs a single setup phase, dragging each cat piece from the off board onto any free interior cell (non-gate). During this phase players may rearrange cats without limit—pick a placed cat back up, drop it somewhere else, swap positions, etc.—until they choose to press `Confirm Formation`. Only after confirmation does the normal turn loop begin.
- Grain Loss Tracker: Start at `0` loss. Each grain eaten by mice increments the counter; reaching `32` loss triggers Game Over.
- Incoming Wave: Six mouse pieces per wave, visualized as a `Next Wave` lane of six icons. As cats generate Meowge, the leftmost icons flip to 😱 to preview how many will be deterred; remaining icons stay 🐭.

## 3. Attributes & Terminology

- `Catch (Paw)`: Attack points. One point spends to deal 1 damage to a target mouse.
- `Meow`: Deter value. Sum of all active meow determines how many mice from the incoming wave flee each end of turn.
- `Hearts`: Cat / mouse health. When a cat or mouse reaches 0 hearts it is removed. Mice can continue upgrading beyond `2/2` in +1/+1 steps every time they successfully eat grain while standing on a shadow cell.
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
   - Calculate Meowge from cats standing on gate cells only (§8). Apply it to the fixed six-slot `Next Wave` lane, flipping the leftmost icons to 😱 for deterred mice; the rest remain 🐭.
   - If Meowge ≥ six, the wave disperses instantly; otherwise, advance to placement.
   - Placement walks each gate’s preferred paths toward the nearest shadow perimeter (south, east, or west depending on the gate) and fills open cells, prioritizing shadow tiles so mice can upgrade next turn.
   - If there are more entrants than legal cells, delete the extras (they fail to infiltrate) and end the phase.
   - The stepper pauses on a Meowge summary frame, one combined scare frame, then individual placement frames before returning control to the cat phase.

## 5. Cat Phase Details

- **Activation**
  - Player selects a cat to make it active (highlight border). Only the active cat can spend catch points or move.
- **Ordering Rules**
  - Each cat may move once per turn and spend catch either before or after that move. If a cat attacks first, it may still take its single move afterwards.
  - Pangur exception: Pangur receives two queen-style moves per turn. He may use them before attacking, after attacking, or split on both sides of a single attack sequence, but cannot chain more than two total moves.
  - Shadow Strike bonus: when a cat begins its first attack of the turn while standing on a shadow tile, it gains +1 temporary catch for that attack sequence. Leaving the shadow tile before starting the attack removes this bonus.
  - Players may swap between cats freely; switching away remembers how many moves/catch the previous cat has remaining.
  - **Guardian Aura (Baircne `2/2`):** Whenever Baircne is adjacent (orthogonal or diagonal) to another friendly cat, he copies that cat’s higher attribute but only for catch. The aura grants +1 catch if the neighbor’s catch exceeds their meow; it no longer grants additional meow.
- **Attacking**
  - Valid targets: Adjacent and diagonal resident mice (max 8 surrounding cells).
  - Spending 1 catch deals 1 damage. Cats may keep spending while they have remaining catch.
  - Shadow Strike bonus adds +1 catch to the first attack sequence only if it was initiated while standing on a shadow tile.
  - Surviving mice become stunned (skip their next activation) and retaliate **once per cat attack** for `max(mouse effective attack − cat effective meow, 0)` hearts. Subsequent cats finishing a stunned mouse take no counter damage.
  - Example: Cat A strikes a mouse, takes retaliation, and leaves it stunned. Cat B can then finish that same mouse without suffering a counter hit.
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
  - Decision rule: if a mouse is **not on a shadow tile** and has a legal move that reaches one this turn, it will always choose to move instead of attacking, even when adjacent to a cat. Otherwise, if a cat occupies one of the eight adjacent cells (orthogonal or diagonal), the mouse attacks instead of moving, spending all of its attack points as 1-heart hits using the targeting priority below. If neither condition applies, it moves according to the heuristic.
  - Targeting priority (re-evaluate after each hit):
    1. Cat with base stat `1/3`.
    2. Any cat nearest to the gates (rows `5` then `4`), breaking ties left→right.
    3. Remaining cats sorted by lowest current hearts, then left→right.
  - Movement: a mouse may travel up to `attack` tiles per turn using only orthogonal steps. Choose a destination path that reaches the closest shadow tile; if multiple routes exist, select the path that minimizes distance to any perimeter shadow edge, even if it requires moving east/west instead of straight south from a gate. Mice cannot move through cats but may pass through fellow mice if the intermediate cell vacates earlier in the same phase.
- **Phase 2 – Feed / Upgrade**
  - Resolve only for mice not stunned and still alive.
  - Every mouse increases the Grain Loss counter by its current tier (1 for base, 2 for `2/2`, etc.). Hitting `32` total loss ends the game immediately.
  - Any mouse on a shadow tile gains +1/+1 after eating, with no upper limit (e.g., `3/3`, `4/4`, etc.). Mice off shadow tiles merely sustain themselves at their current stats.
- **Phase 3 – Cleanup**
  - Remove the stunned flag from every surviving mouse and heal all of them back to their max hearts (whatever their current tier grants).
  - Log summary text for clarity before transitioning into the Incoming Wave stepper.

## 7. Incoming Wave Phase

- **Shared Queue + Live Preview**
  - The UI always shows a “Next Wave” lane of six mice. Active Meowge converts the leading icons into 😱 to preview how many will be deterred; the remainder stay 🐭. Cat moves update the ratio in real time.
- **Deterrence Calculation**
  - At phase start, entrants = `max(6 - Meowge, 0)`. Remove deterred mice from the queue in a single summary step (one frame) and log the scare total.
- **Placement Algorithm**
  - Process gates left-to-right (`B5`, `C5`, `D5`). Skip a gate entirely if a cat currently occupies it.
  - For each gate, evaluate all reachable orthogonal paths that move the mouse closer to any shadow perimeter cell. This may mean stepping south, east, or west depending on which neighbor cell reduces the Manhattan distance to the nearest shadow tile. Collect open cells along these preferred paths until a blocking cat or board edge stops progress.
  - Example: a mouse entering from `D5` will prioritize stepping east to `E5` (shadow) before marching south, since that move immediately reaches the perimeter.
  - Rank these cells by (1) whether they are shadow tiles, (2) distance to the shadow edge (shorter first), (3) proximity to the gate (closer first).
  - Place entering mice by consuming ranked cells from the current gate before moving to the next. Continue cycling until all entrants are placed or no legal cells remain. If there are more entrants than legal cells, delete the excess mice (they fail to infiltrate), giving the cats the advantage for that wave.
- **Stepper Presentation**
  - Frame order: Meowge summary (including total scared), **one combined frame for all scared mice fleeing**, then one frame per placement describing gate + destination.
  - Final frame increments the wave counter, keeps the “Next Wave” lane at six icons, and returns control to the cat phase.

## 8. Special Cells & Modifiers

- **Board Layout JSON**
  - `src/data/boardLayout.json` enumerates every cell with a `terrain` tag (`shadow`, `gate`, `interior`) and optional `entry` block. Entry metadata captures `direction` (`north`, `south`, `east`, `west`) and the number of mice queued outside that perimeter cell on turn 1.
  - The loader validates that entry cells live on the perimeter and that their direction matches the side they touch; invalid layouts fail fast at build time.
  - UI + gameplay both hydrate directly from this file: updating `incomingMice` immediately changes the shared queue sizing and gate-line placement targets with no code changes.

- **Meow Zones**
  - Only the open gates `B5`, `C5`, and `D5` emit meow. A cat must stand on one of these cells for its meow value to count toward Meowge.
  - Meow numbers render with a blue glow when active. Cats off-gate show greyed/disabled meow stats to reinforce that they contribute zero deterrence.
- **Shadow Bonus (Catch)**
  - All outer-ring tiles (row `1`, row `5`, column `A`, column `E`) are marked `shadow` except the three gate cells above.
  - Cats obtain the +1 Shadow Strike bonus only if they initiate their first attack of the turn while standing on any shadow tile. The bonus is not tied to the start of turn anymore; it depends on the cell where the attack begins.
  - UI: cat catch number glows red while Shadow Strike is primed.
  - UI: cat catch number bold with red glow while the bonus is active; render these shadow bonus cells darker so the player can plan formations.

## 9. Resource & State Tracking

- Track per-cat: position (or hand slot), hearts, base catch/meow, temporary modifiers, spent catch, move-used flag.
- Track per-mouse: position, current stats (`1/1` or `2/2`), stun flag.
- Track global: grain loss counter (0→32), single incoming queue (always six slots), turn counter, and the deterrence preview object (`meowge`, `incoming`, `deterred`, `entering`).

## 10. Win & Loss Conditions

- **Win**: No resident mice on board and the incoming queue is empty when the wave would spawn.
- **Loss**
  - Grain loss counter reaches 32.
  - Any cat is killed (instant defeat, even if others survive).
  - Resident mice occupy every interior cell simultaneously.
  - A mouse successfully upgrades to `7/7` (future-proofed capstone threat that cats cannot remove).

## 11. Open Questions

- Lock in the exact heuristic for mouse movement targeting (current plan favors nearest shadow tiles on their gate lines—tweak as we playtest).
- Decide how much animation/pacing polish to add for incoming placement given the single staging lane.
- Confirm which optional controls (undo, restart) are still in scope for this iteration.
