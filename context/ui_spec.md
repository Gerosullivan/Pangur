# Pangur UI Spec (Prototype)

main colour pallet:

#0396A6
#D97014
#73513D
#D96D55
#F2F2F2
#303031

## 1. Screen Layout

- **Resolution Target**: 1440 × 900. Prototype may rely on absolute positioning; responsive behavior is out of scope.
- **Top Metrics Bar**

  - Height: 80px, full width, positioned at `top: 0`.
  - Background: Semi-opaque charcoal (`rgba(20, 24, 32, 0.9)`).
  - Content order (left → right):
    1. Title block `Pangur` with current wave (`Wave 3`).
    2. Grain counter (icon 🌾 + numeric total, e.g., `Grain 16`).
    3. - `Pass Turn to Mice` button (primary CTA; ends cat phase and starts mouse phase).

- **Central Board Region**

  - Grid: 4×4 cells, each 256px × 256px, with 12px gutters.
  - Position: Centered horizontally; `top` offset ~120px from screen edge.
  - Cell Styling:
    - Interior cells: grey.
    - Shadow bonus cells (row 1, columns A/D): dark grey.
    - Open gate cells (B4, C4): light grey.
  - Perimeter occupancy: edge cells prefilled with mouse pieces during setup.

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

## 2. Key Visual Components

- **Cat Piece**
  - Dimensions: 256px × 256px:
    - top row (~15% height): Hearts Panel: floating above badge. One-line display of heart emojis (`❤️` current up to 5, `💚` pending gain, `🖤` pending loss, `🤍` empty slots). Clamp maximum hearts to five per spec
    - bottom row (~15% height):
      - Attack attribute: floating bottom left in red text with any background prevention text shadow
      - Meow attribute: floating bottom right in blue text with any background prevention text shadow
      - Numbers use bold type when modified; apply red outline when catch bonus active, blue outline when meow multiplier active, purple when meow halved.
    - middle row: height remainder in middle: smaller circular badge inset with cat art.
  - Drag State:
    - Card lifts with drop shadow
    - highlight valid cells the cat can move to in green cell colour.
  - Selected state (attacking):
    - red border on circular badge
    - highlight valid mouse targets in surrounding cells with orange cell colour
  - Attack resolved: the cats attack attribute goes down by -1.
  - Deselected
    - when player selects another cat or anything else.
- **Mouse Pieces**
  - Base Pieces Size: same as cat, with these changes:
  - `1/1` Mouse: normal mouse art in badge insert. no heart pips, no floating attack number
  - `2/2` Grain-Fed Mouse:
    - top row: two heart pips floating above badge
    - bottom row: Attack attribute: floating bottom middle in red text
  - State changes: change mouse art in badge insert depending on state: dizzy, dead, eating, scared.
  - Attack Intent: During mouse phase highlight the target mouse and intended cat target with thin red line briefly (200ms) then resolve: both pieces go back to normal.
  - Incoming Queue: Row of mouse pieces above board; scared mice are position slightly above other mice on same row.
- **Buttons**
  - Default: Rounded rectangle, 48px height, .
  - Confirmation: `Pass Turn to Mice` uses orange accent to emphasize irreversible action.

## 3. Interaction Notes

- Hovering a dragged cat over a grid cell:
  - updates the deterrence readout in the top bar in real time.
  - updates the cats attributes according to cell modifiers.
- After pressing `Pass Turn to Mice`, freeze cat controls until mouse phase completes.
