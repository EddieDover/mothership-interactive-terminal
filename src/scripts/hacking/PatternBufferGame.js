import { BaseHackingGame } from "./BaseHackingGame.js";

export class PatternBufferGame extends BaseHackingGame {
  static get type() {
    return "pattern-buffer";
  }

  init() {
    // Base length 9, -1 per 15 skill points, min 4
    // Score 20: 9 | Score 37: 5 | Score 60: 4
    const length = Math.max(4, 9 - Math.floor(this.difficulty / 15));
    this.sequence = [];
    for (let i = 0; i < length; i++) {
      this.sequence.push(Math.floor(Math.random() * 4) + 1); // 1-4
    }

    this.state = {
      sequenceLength: length,
      sequence: this.sequence, // Expose sequence to state for rendering
      currentStep: 0, // How far into the sequence the player is
      displayStep: 0, // For showing the pattern
      status: "waiting", // waiting, displaying, input, won, lost
      playerSequence: [],
      timeLeft: 0,
      maxTime: 0,
    };
  }

  update(dt) {
    if (this.state.status === "displaying") {
      this.state.timeLeft -= dt;
      if (this.state.timeLeft <= 0) {
        this.state.timeLeft = 0;
        this.state.status = "input";
        return true;
      }
      return false; // Don't trigger full re-render for timer ticks
    }
    return false;
  }

  handleAction(action) {
    if (action.type === "ready") {
      if (this.state.status === "waiting") {
        this.state.status = "displaying";
        // 1 second per digit to memorize
        const time = this.state.sequenceLength * 1000;
        this.state.timeLeft = time;
        this.state.maxTime = time;
        return { success: true, complete: false };
      }
      return { success: false, complete: false };
    }

    if (this.state.status !== "input")
      return { success: false, complete: false };

    if (action.type === "press") {
      const value = action.value;

      if (value === this.sequence[this.state.currentStep]) {
        this.state.currentStep++;
        if (this.state.currentStep >= this.sequence.length) {
          this.state.status = "won";
          return {
            success: true,
            complete: true,
            message: game.i18n.localize("FVTT-MII.Hacking.PatternBuffer.Won"),
          };
        }
        return { success: true, complete: false };
      } else {
        this.state.status = "lost";
        return {
          success: false,
          complete: true,
          message: game.i18n.localize("FVTT-MII.Hacking.PatternBuffer.Lost"),
        };
      }
    }
    return { success: false, complete: false };
  }

  get isWon() {
    return this.state.status === "won";
  }
  get isLost() {
    return this.state.status === "lost";
  }
}
