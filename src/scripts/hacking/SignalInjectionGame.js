import { BaseHackingGame } from "./BaseHackingGame.js";

export class SignalInjectionGame extends BaseHackingGame {
  static get type() {
    return "signal-injection";
  }

  init() {
    const width = 8;

    // Random start position for the target zone (avoiding edges)
    const start = Math.floor(Math.random() * (100 - width));

    // Random injection point (locked slider position)
    const injectionPoint = Math.floor(Math.random() * 100);

    // Speed multiplier based on difficulty
    // Base 4.0 (Very Fast), decreases with skill
    // Score 0: 4.0
    // Score 30: 2.5
    // Score 60: 1.0
    const speed = Math.max(0.5, 4.0 - this.difficulty / 20);

    this.state = {
      targetZone: { start: start, end: start + width, width: width },
      injectionPoint: injectionPoint,
      attempts: 3,
      status: "active",
      speed: speed,
      direction: 1,
      zonePos: start,
    };
  }

  update(dt) {
    if (this.state.status !== "active") return false;

    // Move target zone
    // Speed 1 = 20% per second
    const moveAmount = this.state.speed * 20 * (dt / 1000);

    this.state.zonePos += moveAmount * this.state.direction;

    // Bounce
    if (this.state.zonePos <= 0) {
      this.state.zonePos = 0;
      this.state.direction = 1;
    } else if (this.state.zonePos + this.state.targetZone.width >= 100) {
      this.state.zonePos = 100 - this.state.targetZone.width;
      this.state.direction = -1;
    }

    this.state.targetZone.start = this.state.zonePos;
    this.state.targetZone.end =
      this.state.zonePos + this.state.targetZone.width;

    return false; // Don't trigger full re-render for movement
  }

  handleAction(action) {
    if (this.state.status !== "active")
      return { success: false, complete: true };

    if (action.type === "inject") {
      const value = this.state.injectionPoint;

      if (
        value >= this.state.targetZone.start &&
        value <= this.state.targetZone.end
      ) {
        this.state.status = "won";
        return {
          success: true,
          complete: true,
          message: game.i18n.localize("FVTT-MII.Hacking.SignalInjection.Won"),
        };
      } else {
        this.state.attempts--;
        if (this.state.attempts <= 0) {
          this.state.status = "lost";
          return {
            success: false,
            complete: true,
            message: game.i18n.localize(
              "FVTT-MII.Hacking.SignalInjection.Lost"
            ),
          };
        }
        return {
          success: false,
          complete: false,
          message: game.i18n.localize(
            "FVTT-MII.Hacking.SignalInjection.Missed"
          ),
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
