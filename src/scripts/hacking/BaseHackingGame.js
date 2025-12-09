export class BaseHackingGame {
  constructor(difficulty, context) {
    this.difficulty = difficulty; // 0-100 or similar
    this.context = context; // Reference to the main app or needed callbacks
    this.state = {};
  }

  /**
   * Initialize the game state
   */
  init() {
    throw new Error("init() must be implemented");
  }

  /**
   * Restore game from state
   */
  restore(state) {
    this.state = state;
  }

  /**
   * Update game state based on time (optional)
   * @param {number} dt Delta time in milliseconds
   * @returns {boolean} True if state changed and needs broadcast
   */
  update(dt) {
    return false;
  }

  /**
   * Handle user input/action
   * @param {any} action
   * @returns {Object} Result { success: boolean, complete: boolean, message: string }
   */
  handleAction(action) {
    throw new Error("handleAction() must be implemented");
  }

  /**
   * Get data for rendering the template
   */
  getRenderData() {
    return this.state;
  }

  /**
   * Check if the game is won
   */
  get isWon() {
    return false;
  }

  /**
   * Check if the game is lost
   */
  get isLost() {
    return false;
  }
}
