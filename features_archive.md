# Features Archive

This log records previously scoped work that has shipped so we can reference the original goals and acceptance notes without cluttering the active queue.

## Pangur Special Sequencing (Move-Attack-Move / Attack-Move-Attack)

- **Outcome:** Pangur now supports both `MAM` and `AMA` turn flows. Sequence choice becomes visible via the side-panel badge, `End Turn` is blocked until he finishes or the player taps the “Finish Pangur Sequence” control, and the board highlights queen moves for the final leg.
- **Spec Links:** See `context/spec.md` (§5 Cat Phase / Pangur exception) and `context/ui_spec.md` (§1 Side Panel & Action Area notes) for authoritative behaviour + UI details.
- **Rationale:** Enables Pangur to clear or reposition more dynamically without breaking the single move/attack limits applied to the other cats, matching the battle spec.
