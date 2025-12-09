import { BaseHackingGame } from "./BaseHackingGame.js";

export class BruteForceGame extends BaseHackingGame {
  static get type() {
    return "brute-force";
  }

  init() {
    // Generate a random hex string or code
    // Difficulty (Skill) increases time, length is static
    const length = 8;
    const chars = "ABCDEF0123456789";
    let target = "";
    for (let i = 0; i < length; i++) {
      target += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // Base time 5s, +0.15s per skill point
    // Score 20: 8s | Score 40: 11s | Score 60: 14s
    const time = 5000 + this.difficulty * 150;

    this.state = {
      target: target,
      input: "",
      timeLeft: time,
      maxTime: time,
      startTime: Date.now(),
      status: "active",
    };
  }

  update(dt) {
    if (this.state.status !== "active") return false;

    this.state.timeLeft -= dt;
    if (this.state.timeLeft <= 0) {
      this.state.timeLeft = 0;
      this.state.status = "lost";
      return true;
    }
    return false; // Don't trigger full re-render for timer ticks
  }

  handleAction(action) {
    if (this.state.status !== "active")
      return { success: false, complete: true };

    if (action.type === "type") {
      this.state.input = action.value;

      if (this.state.input === this.state.target) {
        this.state.status = "won";
        return {
          success: true,
          complete: true,
          message: game.i18n.localize("FVTT-MII.Hacking.BruteForce.Won"),
        };
      }

      if (this.state.target.startsWith(this.state.input)) {
        return { success: true, complete: false };
      }

      return { success: false, complete: false };
    } else if (action.type === "timeout") {
      this.state.status = "lost";
      return {
        success: false,
        complete: true,
        message: game.i18n.localize("FVTT-MII.Hacking.BruteForce.Lost"),
      };
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
