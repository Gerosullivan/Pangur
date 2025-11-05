# Pangur Technical Spec (Draft)

## Goals

- Rebuild the wave-defense prototype with a clean architecture that can later be ported to Godot without rewriting core rules.
- Keep feature scope tight while supporting future API integrations (telemetry, remote opponents, content services).

## Project Structure

- `context/`: Living design docs (game rules, lore tables, UI spec).
- `components/`: Presentational UI elements and lightweight wrappers (framework-agnostic where possible).
- `game/`: Pure game-logic modules (entities, turn loop, rules engine, state snapshots).
- `assets/`: Shared art referenced by both prototypes and future Godot scenes.
- `utils/`: Helper functions (e.g., sprite maps) that do not depend on a framework.

## Architectural Principles

1. **Isolation of Game Logic**
   - Keep entities (`Cat`, `Mouse`, grid state) framework-free. Provide serialization hooks so Godot can consume the same state objects.
   - Expose deterministic functions for turn resolution, with no DOM or rendering side-effects.
2. **UI as Thin Layer**
   - Components read from immutable state snapshots and emit intent events (e.g., `onAttack`, `onMove`).
   - Route player actions through a controller that updates the pure game model, then re-renders.
3. **Portability**
   - Avoid platform-specific APIs; wrap input/output (audio, animation) behind adapters.
   - Plan for Godot by mirroring naming conventions and using data structures that map to GDScript dictionaries/arrays.
4. **API Readiness**
   - Centralize networking concerns in an `services/` module (future). For now, define interface stubs (e.g., `TelemetryClient`) that can be swapped with real implementations.
   - Maintain a versioned schema for saved games and upcoming REST payloads (`schemas/` folder TBD).
5. **State Persistence**
   - Serialize full board snapshots at the end of each phase; store as JSON compatible with both JavaScript and Godot.
   - Keep RNG seeds and turn counters in state to guarantee replayability across clients.

## Tooling (Prototype)

- Preferred stack: Vite + React for rapid UI iteration (matches legacy setup).
- Testing: Lightweight Jest/Vitest for logic modules (optional for early prototype).
- Formatting: Prettier + ESLint (reuse configs when migrating files).

## Migration Considerations

- Legacy assets and components included here are source-of-truth for styling; strip React-specific logic when porting to Godot scenes.
- Document divergences from legacy behavior in `context/changelog.md` (TBD) to keep future ports in sync.
