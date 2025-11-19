# Pangur Technical Notes

This prototype intentionally leaves implementation details to the next developer.

## Goals

- Keep scope tightly focused on the core turn loop prototype.
- Favor the simplest approach that satisfies the current design specs.
- Record any trade-offs or new questions back in the context docs as work progresses.

## Current Implementation Priorities

1. **Board + Layout**
   - Promote the grid helpers to handle 5×5 coordinates (`A-E`, `1-5`) and a shadow perimeter with gates at `B5/C5/D5`.
   - Remove the auto-spawned perimeter mice and rely solely on the shared incoming queue for new mice.
2. **Cats**
   - Replace Pangur’s special-sequence logic with a simple two-move counter and ensure every cat now uses queen-style movement.
   - Shadow Strike bonus only applies if the cat starts its first attack from a shadow tile; store that transient flag per cat each turn.
   - Cat attacks must trigger mouse retaliation damage of `max(mouse attack − cat meow, 0)` and heal the cat on kills.
3. **Mice**
   - During the resident phase, give each unstunned mouse a “attack if adjacent else move up to attack value orthogonally” behavior with Pangur aura handling (+1 attack for adjacent `2/2` mice).
   - Feeding/upgrading should consume grain but only award stat boosts if the mouse currently occupies a shadow tile; heal surviving mice in cleanup.
4. **Incoming Wave**
   - Maintain a single queue (max six) with live Meowge preview. Meow only counts from cats on gate cells.
   - Placement must obey the “mouse line” from each gate, prioritizing shadow tiles on that line before other cells. Abort with a loss if there is insufficient space.
5. **Win/Loss**
   - Add checks for any cat death, the entire board filling with mice, and future-proofing for a `7/7` mouse alongside the existing grain/overrun failures.
