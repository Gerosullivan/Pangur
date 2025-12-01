# Pangur Technical Notes

This prototype intentionally leaves implementation details to the next developer.

## Goals

- Keep scope tightly focused on the core turn loop prototype.
- Favor the simplest approach that satisfies the current design specs.
- Record any trade-offs or new questions back in the context docs as work progresses.

## Key Implementation Notes

1. **Board + Layout**
   - Grid helpers (`src/lib/board.ts`) operate on a 5×5 interior (`A-E`, `1-5`) and load the active layout from the selected mode. Base layout entrances are `B5/C5/D5`; the monastery layout (`src/data/boardLayout_monastery.json`) uses `C1/E3/C5`. All other perimeter cells are `shadow` terrain.
   - Resident mice are seeded from the chosen `initialMice` file (base/easy/hard) independent of the layout; Monastery Siege uses the hard perimeter file on the monastery board. Entry metadata in the layout file drives gate placement for the shared queue.
2. **Cats**
   - Movement validator treats every cat as a queen mover; Pangur tracks a per-turn `movesRemaining = 2` counter.
   - Shadow Strike is tracked on each cat when its first attack originates from a shadow tile. Baircne’s passive (“Bonded Strike”) checks adjacency to Pangur and grants +1 catch (never meow) whenever they’re neighboring.
   - Attacks call into mechanics helpers to apply damage, trigger single retaliation hits, and heal on kills.
3. **Mice**
   - Resident phase logic first lets mice move toward shadow tiles (up to their attack value in orthogonal steps); they will forgo attacks if that move reaches a shadow tile.
   - Feeding increments the grain loss counter and upgrades any shadow-sitting mouse by +1/+1 without an upper cap, followed by a cleanup heal + stun reset.
4. **Incoming Wave**
   - Deterrence uses a single Meowge value coming from entrance cats only. Preview + stepper share the same six-slot “Next Wave” lane, flipping icons 🐭↔😱.
   - Placement searches orthogonal paths from each entrance toward the nearest shadow perimeter (south/east/west) and prioritizes shadow cells. Excess entrants are discarded if no legal tiles remain.
5. **Win/Loss**
   - Global checks monitor: grain loss reaching 32, any cat death, full board occupation by mice, and a mouse scaling to 7/7. Incoming overflow simply deletes extra mice instead of causing a loss.
6. **Logging**
   - Every game action (cat placement/move/attack, mouse frames, incoming placements, init) emits a structured event with an incrementing sequence, stamped to console and `state.log` for future replay/export use.
