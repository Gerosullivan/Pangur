# Pangur UI Spec (Prototype)

main colour pallet:

#0396A6
#D97014
#73513D
#D96D55
#F2F2F2
#303031

## 1. Screen Layout

Use a fixed canvas (no responsive scaling):

- Canvas: `.app-shell` locked to 1376px × 768px with `/assets/background.jpeg` as the backdrop. Layout uses pixel units everywhere.
- Left cluster:
  - Incoming lane: 542px wide × 54px tall, absolutely positioned on the shell (detached from any column flow) with six fixed slots showing the 😱/🐭 preview.
  - Board: 542px × 542px board art; keep the 5×5 CSS grid aligned to that fixed pixel size.
- Right parchment:
  - Right column: ~416px wide stack pinned to the right with internal scrolling between its top (≈182px) and bottom (≈40px) offsets so content stays visible inside the shell height.
- Action/control UI lives inside the right column stack with tutorial + cat info instead of spanning a full-width bottom row. Phase label + restart are separate badges on the right edge (no top bar).

- **Incoming Mice Row**

  - Height: 54px, width: 542px, anchored to the shell (absolute) rather than consuming flow height.
  - Background: Barn lane art matching the new shell.
  - Left-justified label `Next Wave`, followed by a fixed row of six mouse slots that never changes length. Meow preview swaps slots to 😱 when Meowge would deter that mouse; remaining slots show 🐭.
  - A separate `Wave N` pill sits just above this lane on the left, anchored to the same horizontal start as the lane.
  - Grain tracker moves out of the top bar into its own pill beneath the board, aligned to the board’s left edge: `Grain Loss 0 / 32`.
  - Phase text + Restart live on the right side of the shell as their own badges/buttons (no longer in the top bar).

- **Central Board Region**

  - Grid: 5×5 cells sized to the fixed 542px board.
  - Layout must use CSS Grid so each square maps cleanly to board coordinates (avoid flexbox positioning).
  - A subtle lightened backdrop sits under the board footprint to lift the square off the background art.
  - Cell Styling:
    - Interior cells: grey.
    - Shadow bonus cells (outer ring minus gates): dark grey.
    - Open gate cells (`B5`, `C5`, `D5`): yellow with subtle glowing outline to hint at meow interaction.
  - Setup begins with perimeter cells pre-populated by `1/1` mice (per layout config) while interior cells are empty and cats start in hand.

  - **Right Side Panel (active when cat selected)**
  - Uses the 520px parchment column; scrolls if stacked panels exceed the vertical space.
  - Information panel showing:
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

- **Action / Control Stack**

  - Lives under the tutorial panel in the right column (no separate bottom row).
  - Cat-hand remains 98px × 98px per piece during setup.
  - Setup message still prompts placement; `Confirm Formation` gating unchanged.
  - Post-setup buttons (`End Turn`, `Next` during stepper, restart/export) remain, centered within the column stack.
  - Stepper behavior: resident attacks still advance one frame per hit, but incoming deterrence now uses **one combined frame** for all scared mice leaving before individual placement frames. Stepper persists through all sub-phases until the incoming wave phase concludes, then hands control back to the cat phase.

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
