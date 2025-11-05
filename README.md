# Pangur Prototype Bootstrap

This folder gathers the files needed to spin up the new Pangur wave-defense prototype.

## Included Artifacts
- `context/4x4grid_version.md` — core game rules (kept up to date).
- `context/technical_spec.md` — architectural guidance for a Godot-ready codebase and future API hooks.
- `context/ui_spec.md` — layout notes for the prototype HUD, action buttons, and cat hand placement.
- `context/cat_lore_table.md` — legacy cat stats for naming consistency.
- `components/` — Cat and mouse UI components copied from the legacy React build.
- `game/` — Framework-free cat/mouse entities and supporting config data.
- `assets/` — Current art assets required by the cards and board.
- `AGENTS.md`, `CLAUDE.md` — existing collaboration notes.

Start new implementation work here, keeping the specs synchronized as features ship. When the interactive build stabilizes, port the deterministic game logic into Godot scenes while reusing assets and component styling as reference.
