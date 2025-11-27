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
    2. Grain loss tracker (icon 🌾 + numeric total, e.g., `Grain Loss 12 / 32`).

- **Incoming Mice Row**

  - Height: 80px, full width.
  - Background: Semi-opaque charcoal (`rgba(20, 24, 32, 0.9)`).
  - Left-justified label `Next Wave`, followed by a fixed row of six mouse slots that never changes length.
  - Meow preview swaps slots to 😱 when Meowge would deter that mouse; remaining slots show 🐭.

- **Central Board Region**

  - Grid: 5×5 cells with responsive/flexible sizing to fill available space
  - Layout must use CSS Grid so each square maps cleanly to board coordinates (avoid flexbox positioning).
  - Cell Styling:
    - Interior cells: grey.
    - Shadow bonus cells (outer ring minus gates): dark grey.
    - Open gate cells (`B5`, `C5`, `D5`): yellow with subtle glowing outline to hint at meow interaction.
  - Setup begins with perimeter cells pre-populated by `1/1` mice (per layout config) while interior cells are empty and cats start in hand.

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
      - Baircne passive indicator: when the `2/2` cat sits next to Pangur, show a `Pangur’s Shield +1 Catch` badge on Baircne’s panel (not Pangur’s). His meow stat always stays 2 regardless of this passive.

- **Bottom Action Area**

  - Height: 140px, full width
  - Contains cat-hand div at beginning of game (centered)
  - Cat pieces in hand: 98px × 98px
  - Setup message appears to the right of cat pieces with left arrow: "← Drag cats onto the board to start (avoid perimeter cells)"
  - Players may drag already-placed cats back into the hand (or onto new cells) freely during setup; no limit until `Confirm Formation` is pressed.
  - Once all cats are placed, show a primary `Confirm Formation` button; the main turn loop only begins after the player clicks it.
  - After confirmation, replace the setup UI with action button(s), center middle
    - `End Turn` button (primary CTA; ends cat phase and starts mouse phase).
    - other buttons like `Restart game` and `Undo move` (TBC)
  - When `End Turn` is pressed, swap the action button group for a `Phase Stepper` control rail: `Next` primary button, disabled `Previous` stub (future-proofed), and textual label describing the current frame (e.g., `Resident Mouse Attack 1/5`).
  - Stepper behavior: resident attacks still advance one frame per hit, but incoming deterrence now uses **one combined frame** for all scared mice leaving before individual placement frames.
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
  - Incoming Queue: labelled `Next Wave`, always six slots. Swap the leftmost slots to 😱 as Meowge increases; remaining slots show 🐭.
- **Buttons**
  - Default: Rounded rectangle, 48px height, .
  - Confirmation: `End Turn` uses orange accent to emphasize irreversible action.

## 3. Interaction Notes

- Hovering a dragged cat over a grid cell:
  - updates the deterrence readout in the top bar and live `Next Wave` icon mix (swap 🐭↔😱) in real time.
  - updates the cats attributes according to cell modifiers.
- During the cat phase, dragging a placed cat onto a legal destination cell performs its queen move immediately (same drag UX as setup placement). Only cats with remaining moves should be draggable.
- After pressing `End Turn`, freeze cat controls until mouse phase completes.
- During resident mouse and incoming wave phases, dim non-active UI and focus on the Phase Stepper; each `Next` press should trigger one discrete state change so automated tests can assert the intermediate board states.

## 4. Polish Ideas

- Highlight valid move destinations and attack targets while a cat is selected.
- Use outline colour shifts on stat numbers to show bonuses (red for catch, blue for meow, purple when halved).
- Show a thin red line during mouse attacks to telegraph the target.
- Raise scared mice in the incoming queue slightly to distinguish them from entering mice.
