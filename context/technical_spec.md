# Pangur Technical Notes

This prototype intentionally leaves implementation details to the next developer.

## Goals

- Keep scope tightly focused on the core turn loop prototype.
- Favor the simplest approach that satisfies the current design specs.
- Record any trade-offs or new questions back in the context docs as work progresses.

## Key Implementation Notes

1. **Board + Layout**
   - Grid helpers (`src/lib/board.ts`) operate on a 5×5 interior (`A-E`, `1-5`). All perimeter cells are `shadow` terrain except gates `B5/C5/D5`, and the default layout spawns `1/1` mice on every perimeter tile (but remains fully data-driven via `boardLayout.json`).
   - Entry metadata in `boardLayout.json` seeds the “Next Wave” lane but no longer spawns per-edge staging bands; designers can toggle perimeter occupants through the same file.
2. **Cats**
   - Movement validator treats every cat as a queen mover; Pangur tracks a per-turn `movesRemaining = 2` counter.
   - Shadow Strike is tracked on each cat when its first attack originates from a shadow tile. Baircne’s passive (“Pangur’s Shield”) checks adjacency to Pangur and grants +1 catch (never meow) whenever they’re neighboring.
   - Attacks call into mechanics helpers to apply damage, trigger single retaliation hits, and heal on kills.
3. **Mice**
   - Resident phase logic first lets mice move toward shadow tiles (up to their attack value in orthogonal steps); they will forgo attacks if that move reaches a shadow tile.
   - Feeding increments the grain loss counter and upgrades any shadow-sitting mouse by +1/+1 without an upper cap, followed by a cleanup heal + stun reset.
4. **Incoming Wave**
   - Deterrence uses a single Meowge value coming from gate cats only. Preview + stepper share the same six-slot “Next Wave” lane, flipping icons 🐭↔😱.
   - Placement searches orthogonal paths from each gate toward the nearest shadow perimeter (south/east/west) and prioritizes shadow cells. Excess entrants are discarded if no legal tiles remain.
5. **Win/Loss**
   - Global checks monitor: grain loss reaching 32, any cat death, full board occupation by mice, and a mouse scaling to 7/7. Incoming overflow simply deletes extra mice instead of causing a loss.
