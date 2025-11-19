# Pangur UI Spec (Prototype)

main colour pallet:

#0396A6
#D97014
#73513D
#D96D55
#F2F2F2
#303031

## 1. Screen Layout

Use responsive layout:

- outer grid, 4 flex rows:

  - row 1: top-bar div, fixed height (80px)
  - row 2: incoming-mice-row div, fixed height (80px)
  - row 3: Central Board Region, fills the leftover height
  - row 4: action-area div, fixed height (140px)

- **Top Metrics Bar**

  - Height: 80px, full width.
  - Background: Semi-opaque charcoal (`rgba(20, 24, 32, 0.9)`).
  - Content order (left → right):
    1. Title block `Pangur` with current wave (`Wave 3`).
    2. Grain counter (icon 🌾 + numeric total, e.g., `Grain 16`).

- **Incoming Mice Row**

  - Height: 80px, full width.
  - Background: Semi-opaque charcoal (`rgba(20, 24, 32, 0.9)`).
  - Contains a single staging lane of up to six mouse icons.
  - Scared mice (deterred by Meowge) float slightly higher using 😱 icons; entering mice stay on the baseline as 🐭.

- **Central Board Region**

  - Grid: 5×5 cells with responsive/flexible sizing to fill available space
  - Layout must use CSS Grid so each square maps cleanly to board coordinates (avoid flexbox positioning).
  - Cell Styling:
    - Interior cells: grey.
    - Shadow bonus cells (outer ring minus gates): dark grey.
    - Open gate cells (`B5`, `C5`, `D5`): yellow with subtle glowing outline to hint at meow interaction.
  - Setup begins with all board cells empty; only cats in hand are visible.

  - **Right Side Panel (active when cat selected)**
  - 300px wide information panel showing:
    - Selected cat portrait + stats.
      - Portrait Area: Full cat art
      - Role Ribbon: Bottom overlay showing role (e.g., `Guardian`) in small capitals.
      - Lore detail: see ./context/cat_lore_table.md
      - Stats Row: Horizontal band below portrait listing `Catch` and `Meow`.
      - Hearts Panel: Two-line display of heart emojis (`❤️` current up to 5, `💚` pending gain, `🖤` pending loss, `🤍` empty slots). Clamp maximum hearts to five per spec.
      - Status Badges:
        - `Moved` badge appears once move consumed.
        - `Catch 0` grey badge if out of attacks this turn.
      - full meow and attack base points and modifiers. e.g. "Attack 4 (3 base +1 shadow bonus")"
      - Pangur-specific callout: show a `Moves 2/2` badge that decrements after each queen move so players track his remaining mobility at a glance.
      - Guardian-specific aura indicator: when Baircne’s aura is active, surface an `Aura +1 Catch` or `Aura +1 Meow` badge (or both) and name the contributing cat inside the stat breakdown text (e.g., “+1 aura (Pangur)”).

- **Bottom Action Area**

  - Height: 140px, full width
  - Contains cat-hand div at beginning of game (centered)
  - Cat pieces in hand: 98px × 98px
  - Setup message appears to the right of cat pieces with left arrow: "← Drag cats onto the board to start (avoid perimeter cells)"
  - Once all cats are placed, show a primary `Confirm Formation` button; the main turn loop only begins after the player clicks it.
  - After confirmation, replace the setup UI with action button(s), center middle
    - `End Turn` button (primary CTA; ends cat phase and starts mouse phase).
    - other buttons like `Restart game` and `Undo move` (TBC)
  - When `End Turn` is pressed, swap the action button group for a `Phase Stepper` control rail: `Next` primary button, disabled `Previous` stub (future-proofed), and textual label describing the current frame (e.g., `Resident Mouse Attack 1/5`).
  - Phase Stepper persists through all sub-phases until the incoming wave phase concludes, then hand control back to the action buttons for the next cat phase.

## 2. Key Visual Components

- **Cat Piece**
  - Square footprint, same size as board cell.
  - Hearts panel floats above the badge (max five hearts using emoji).
  - Bottom band shows catch on left (red text) and meow on right (blue text).
  - Central circular badge holds the cat art.
- **Mouse Pieces**
  - Base Pieces Size: same as cat, with these changes:
  - `1/1` Mouse: normal mouse art in badge insert. no heart pips, no floating attack number
  - `2/2` Grain-Fed Mouse:
    - top row: two heart pips floating above badge
    - bottom row: Attack attribute: floating bottom middle in red text
  - Persistent heart pips stay visible even after combat damage so players can track how close a mouse is to defeat.
  - Incoming Queue: single horizontal lane above the board; scared 😱 mice float, entering 🐭 sit baseline.
- **Buttons**
  - Default: Rounded rectangle, 48px height, .
  - Confirmation: `End Turn` uses orange accent to emphasize irreversible action.

## 3. Interaction Notes

- Hovering a dragged cat over a grid cell:
  - updates the deterrence readout in the top bar and the Meowge counters in the incoming lane in real time.
  - updates the cats attributes according to cell modifiers.
- After pressing `End Turn`, freeze cat controls until mouse phase completes.
- During resident mouse and incoming wave phases, dim non-active UI and focus on the Phase Stepper; each `Next` press should trigger one discrete state change so automated tests can assert the intermediate board states.

## 4. Polish Ideas

- Highlight valid move destinations and attack targets while a cat is selected.
- Use outline colour shifts on stat numbers to show bonuses (red for catch, blue for meow, purple when halved).
- Show a thin red line during mouse attacks to telegraph the target.
- Raise scared mice in the incoming queue slightly to distinguish them from entering mice.
