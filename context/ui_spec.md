# Pangur UI Spec (Prototype)

## Screen Layout

- **Resolution Target**: 1440 × 900 (absolute positioning acceptable). Document offsets so layouts can be ported to Godot scenes.
- **Top Bar (Metrics)**
  - Location: Fixed strip, 80px height, full width.
  - Contents (left → right):
    1. Game title `Pangur` and turn counter.
    2. Grain total with icon (e.g., 🌾 `16`).
    3. Incoming wave number / queue size (`Wave 1 · 12 incoming`).
    4. Total meow deterrence preview (`Meow Shield: 6`).
  - Background: Semi-opaque dark panel to separate from board art.
- **Center Stage (Board)**
  - 4×4 grid centered horizontally, offset 120px from top bar.
  - Shadow bonus cells tinted darker; open gate cells (B4/C4) lighter.
  - Perimeter mice tokens sit on edge cells by default; interior cells empty unless filled by drag-drop.
  - Hover tooltips show cell modifiers (meow multiplier, catch bonus).
- **Bottom Bar (Permanent Actions)**
  - Location: Fixed strip, 120px height, full width, 24px padding.
  - Contents (left → right):
    1. Cat hand (three cards) displayed side-by-side, identical styling to in-board cards.
    2. Action buttons cluster:
       - `Pass Turn to Mice` (ends cat phase; same copy as in rules).
  - Button styling: Large, high-contrast rectangles

## Interaction Notes

- Drag-and-drop placement uses board snapping with live attribute preview overlay on the card numbers.
- When hovering a board cell, update top bar deterrence preview in real time.
- After `Pass Turn to Mice`, lock all cat interactions until mouse phase resolves.
