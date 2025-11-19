# Upcoming Feature Work

Handoff-ready plan for the next iteration. Keep specs in `context/spec.md` aligned as each block ships.

## 1. Board & Layout Upgrade

- Expand geometry to 5x5 (add column `E`, row `5`). Ensure `src/types.ts`, `src/lib/board.ts`, board layout JSON, and styling all honor the new grid.
- Mark the outer ring as `shadow` terrain except the new gates at `B5`, `C5`, `D5`. Entry definitions for those cells should cap the combined incoming queue at six mice.
- Initial game state now spawns `1/1` mice on every perimeter cell (still data-driven via `boardLayout.json`), while interior cells remain open for cat placement.
- During setup, players can drag cats on/off the board freely with no limits until they click `Confirm Formation`; make sure the store + UI allow infinite rearrangements before locking in.
- Specs + docs need to describe the new single incoming staging area (see §4) once code lands.

## 2. Cat Rules Refresh

- Let every cat move like a chess queen; remove Pangur-only movement code (shared validator for `Board.tsx` + `gameStore.moveCat`).
- Replace Pangur’s MAM/AMA tracking with a simple “two moves per turn” counter that resets each cat phase.
- Allow attack-first or move-first turns globally. Track the attack-starting cell so only cats who began attacking from shadow keep the +1 catch bonus.
- Extend `attackMouse` so surviving mice retaliate for `max(mouse.attack - effectiveMeow, 0)` damage. Hook into existing cat defeat logic.

## 3. Resident Mouse Phase Changes

- Give mice a dedicated movement phase: each unstunned mouse either attacks an adjacent cat or walks up to its attack value in orthogonal steps toward its goal (prefer shadows/gates). Encode the heuristic in `context/spec.md`.
- Restrict upgrades to mice standing on shadow cells during the feed phase.
- Surviving mice heal to full hearts during cleanup; display persistent hearts in `MousePiece` when hearts > 1 to show damage.
- Baircne passive: the `2/2` cat gains +1 catch whenever he is adjacent to Pangur (no meow bonus). Surface this as Baircne’s passive badge rather than Pangur’s.

## 4. Incoming Wave Logic

- Replace the ring UI with **one shared incoming mice area** (think staging lane) that shows the live deterrence total (“Meowge”) updating continuously from cat placement. No perimeter emojis remain.
- Meow deterrence only occurs from cats on gate cells (no more doubled zones). A cat’s meow reduces the six-mouse cap directly; the shared staging UI should show total incoming, deterred, and entering counts driven by this single preview object.
- Refactor `refillEntryQueues` into a single queue feeding all gates. When entrants spawn, compute the legal “mouse line” per gate: walk from the gate cell straight inward (orthogonal only), skipping gates blocked by cats, and stop when the line encounters a cat or the board edge. Within that line, choose exact cells by weighting shadow tiles first so mice tend to end turns where they can upgrade next turn (e.g., prioritize the nearest shadow cell along the path; fall back to the first open tile).
- Update the deterrence preview UI and entry bands (now a single staging panel) plus specs to reflect the consolidated queue and placement priorities.

## 5. Win / Loss Conditions & Cleanup

- Loss triggers now include: all interior cells filled by mice, any cat death, or a mouse reaching `7/7`.
- Keep the existing “grain 0” and “building overwhelmed” checks. Win still fires when no mice remain on board and in queues.
- Document the revised conditions in the spec and confirm the stepper transitions reset stunned/healed flags correctly.

## 6. QA / Follow-Up

- After each milestone, validate flows manually via the local Vite dev server and the Playwright MCP tool.
- Sync `context/spec.md`, `features_archive.md`, or other battle specs as soon as functionality lands to keep design + code in lockstep.
