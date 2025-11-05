/**
 * Mouse Sprite Helper
 * Maps mouse states to appropriate sprite images
 */

/**
 * Get the appropriate sprite image path for a mouse based on its state
 * @param {Object} mouse - The mouse object with status, isGrainFed, stunned properties
 * @param {string} emojiOverride - Optional emoji override from VisualStateManager
 * @returns {string} Path to the sprite image
 */
export function getMouseSprite(mouse, emojiOverride) {
  // Priority order: dead > eating > scared/fled > stunned > grain-fed > normal

  // Dead state - highest priority
  if (mouse?.status === 'dead' || emojiOverride === '☠️') {
    return '/mice/mouse_dead.png';
  }

  // Eating state (from VisualStateManager during MICE_EAT step)
  if (emojiOverride === '🍴') {
    return '/mice/mouse_eating.png';
  }

  // Scared/startled state (from VisualStateManager during MICE_STARTLED step)
  if (emojiOverride === '😱') {
    return '/mice/mouse_scared.png';
  }

  // Fled state (from VisualStateManager during MICE_DETERRED step or mouse status)
  if (emojiOverride === '💨' || mouse?.status === 'fled') {
    return '/mice/mouse_scared.png'; // Reuse scared sprite for fled
  }

  // Stunned state
  if (mouse?.stunned === true) {
    return '/mice/mouse_dizzy.png';
  }

  // Grain-fed state
  if (mouse?.isGrainFed === true) {
    return '/mice/mouse_grain_fed.png';
  }

  // Normal/default state
  return '/mice/mouse_normal.png';
}

export default getMouseSprite;
