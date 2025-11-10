# Features Archive

This log records previously scoped work that has shipped so we can reference the original goals and acceptance notes without cluttering the active queue.

## Pangur Special Sequencing (Move-Attack-Move / Attack-Move-Attack)

- **Outcome:** Pangur now supports both `MAM` and `AMA` turn flows. Sequence choice becomes visible via the side-panel badge, `End Turn` is blocked until he finishes or the player taps the “Finish Pangur Sequence” control, and the board highlights queen moves for the final leg.
- **Spec Links:** See `context/spec.md` (§5 Cat Phase / Pangur exception) and `context/ui_spec.md` (§1 Side Panel & Action Area notes) for authoritative behaviour + UI details.
- **Rationale:** Enables Pangur to clear or reposition more dynamically without breaking the single move/attack limits applied to the other cats, matching the battle spec.

## Guardian Synergy Aura (2/2 Cat Stat Borrowing)

- **Outcome:** Baircne now checks all eight neighboring cells each frame and copies the dominant stat of nearby allies: Pangur grants +1 catch, the Guardian (`1/3`) grants +1 meow, and having both adjacent provides both bonuses. Aura bonuses apply before terrain modifiers and disappear instantly when formations break.
- **Behaviour Notes:** Bonuses stack with terrain (shadow, gate). Side panel shows `Aura +1 Catch/Meow` badges plus the contributing cat name inside the stat breakdown, and cat pieces inherit the boosted stats so deterrence previews remain accurate.
- **Testing Notes:** Verified adjacency across orthogonal and diagonal positions, ensured bonuses drop the moment the supporting cat moves or is removed, and confirmed deterrence + remaining catch tracking includes aura adjustments.
