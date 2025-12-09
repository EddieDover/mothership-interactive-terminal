import { beforeEach, describe, expect, it } from "vitest";
import { BruteForceGame } from "../src/scripts/hacking/BruteForceGame.js";
import { DataStreamGame } from "../src/scripts/hacking/DataStreamGame.js";
import { NodeOverloadGame } from "../src/scripts/hacking/NodeOverloadGame.js";
import { PatternBufferGame } from "../src/scripts/hacking/PatternBufferGame.js";
import { SignalInjectionGame } from "../src/scripts/hacking/SignalInjectionGame.js";
import { WordGuessGame } from "../src/scripts/hacking/WordGuessGame.js";

// Mock global game object
global.game = {
  i18n: {
    localize: (key) => key,
  },
};

describe("Hacking Minigames", () => {
  describe("BruteForceGame", () => {
    let game;

    beforeEach(() => {
      game = new BruteForceGame(50, {});
      game.init();
    });

    it("should initialize with correct state", () => {
      expect(game.state.status).toBe("active");
      expect(game.state.target).toBeDefined();
      expect(game.state.input).toBe("");
      expect(game.state.timeLeft).toBeGreaterThan(0);
    });

    it("should handle correct input", () => {
      const target = game.state.target;
      const result = game.handleAction({ type: "type", value: target });
      expect(result.success).toBe(true);
      expect(result.complete).toBe(true);
      expect(game.state.status).toBe("won");
      expect(game.isWon).toBe(true);
    });

    it("should handle incorrect input", () => {
      const result = game.handleAction({ type: "type", value: "WRONG" });
      expect(result.success).toBe(false);
      expect(result.complete).toBe(false);
      expect(game.state.status).toBe("active");
      expect(game.isWon).toBe(false);
      expect(game.isLost).toBe(false);
    });

    it("should handle timeout", () => {
      // Simulate time passing until 0
      game.update(100000);
      expect(game.state.timeLeft).toBe(0);
      expect(game.state.status).toBe("lost");
      expect(game.isLost).toBe(true);
    });

    it("should return correct type", () => {
      expect(BruteForceGame.type).toBe("brute-force");
    });

    it("should not update when inactive", () => {
      game.state.status = "lost";
      const result = game.update(100);
      expect(result).toBe(false);
    });

    it("should not handle action when inactive", () => {
      game.state.status = "lost";
      const result = game.handleAction({ type: "type", value: "A" });
      expect(result.complete).toBe(true);
      expect(result.success).toBe(false);
    });

    it("should handle partial match", () => {
      const char = game.state.target[0];
      const result = game.handleAction({ type: "type", value: char });
      expect(result.success).toBe(true);
      expect(result.complete).toBe(false);
    });

    it("should handle timeout action", () => {
      const result = game.handleAction({ type: "timeout" });
      expect(result.success).toBe(false);
      expect(result.complete).toBe(true);
      expect(game.state.status).toBe("lost");
    });
  });

  describe("WordGuessGame", () => {
    let game;

    beforeEach(() => {
      game = new WordGuessGame(0, {});
      game.init();
    });

    it("should initialize with words and target", () => {
      expect(game.state.words.length).toBeGreaterThan(0);
      expect(game.state.target).toBeDefined();
      expect(game.state.words).toContain(game.state.target);
      expect(game.state.attempts).toBe(4);
    });

    it("should handle correct guess", () => {
      const target = game.state.target;
      const result = game.handleAction({ type: "guess", word: target });
      expect(result.success).toBe(true);
      expect(result.complete).toBe(true);
      expect(game.state.status).toBe("won");
      expect(game.isWon).toBe(true);
    });

    it("should handle incorrect guess", () => {
      const wrongWord = game.state.words.find((w) => w !== game.state.target);
      const result = game.handleAction({ type: "guess", word: wrongWord });
      expect(result.success).toBe(false);
      expect(result.complete).toBe(false);
      expect(game.state.attempts).toBe(3);
      expect(game.state.history.length).toBe(1);
      expect(game.isWon).toBe(false);
      expect(game.isLost).toBe(false);
    });

    it("should lose after max attempts", () => {
      const wrongWord = game.state.words.find((w) => w !== game.state.target);
      for (let i = 0; i < 4; i++) {
        game.handleAction({ type: "guess", word: wrongWord });
      }
      expect(game.state.status).toBe("lost");
      expect(game.isLost).toBe(true);
    });

    it("should return correct type", () => {
      expect(WordGuessGame.type).toBe("word-guess");
    });

    it("should not handle action when inactive", () => {
      game.state.status = "lost";
      const result = game.handleAction({ type: "guess", word: "TEST" });
      expect(result.complete).toBe(true);
      expect(result.success).toBe(false);
    });

    it("should handle empty action", () => {
      const result = game.handleAction({ type: "guess" });
      expect(result.success).toBe(false);
      expect(result.complete).toBe(false);
    });
  });

  describe("SignalInjectionGame", () => {
    let game;

    beforeEach(() => {
      game = new SignalInjectionGame(50, {});
      game.init();
    });

    it("should initialize target zone", () => {
      expect(game.state.targetZone).toBeDefined();
      expect(game.state.targetZone.width).toBeGreaterThan(0);
      expect(game.state.attempts).toBe(3);
    });

    it("should update zone position", () => {
      const initialPos = game.state.zonePos;
      game.update(100); // 100ms
      expect(game.state.zonePos).not.toBe(initialPos);
    });

    it("should handle successful injection", () => {
      // Force injection point to be inside target zone
      game.state.targetZone = { start: 40, end: 60, width: 20 };
      game.state.injectionPoint = 50; // Inside 40-60

      const result = game.handleAction({ type: "inject" });
      expect(result.success).toBe(true);
      expect(result.complete).toBe(true);
      expect(game.state.status).toBe("won");
      expect(game.isWon).toBe(true);
    });

    it("should handle failed injection", () => {
      // Force a miss
      game.state.targetZone = { start: 80, end: 90, width: 10 };
      game.state.injectionPoint = 10; // Outside 80-90

      const result = game.handleAction({ type: "inject" });
      expect(result.success).toBe(false);
      expect(game.state.attempts).toBe(2);
      expect(game.isWon).toBe(false);
      expect(game.isLost).toBe(false);
    });

    it("should return correct type", () => {
      expect(SignalInjectionGame.type).toBe("signal-injection");
    });

    it("should not update when inactive", () => {
      game.state.status = "lost";
      const result = game.update(100);
      expect(result).toBe(false);
    });

    it("should not handle action when inactive", () => {
      game.state.status = "lost";
      const result = game.handleAction({ type: "inject" });
      expect(result.complete).toBe(true);
      expect(result.success).toBe(false);
    });

    it("should lose after max attempts", () => {
      game.state.targetZone = { start: 80, end: 90, width: 10 };
      game.state.injectionPoint = 10; // Outside 80-90

      // 3 misses
      game.handleAction({ type: "inject" });
      game.handleAction({ type: "inject" });
      const result = game.handleAction({ type: "inject" });

      expect(result.success).toBe(false);
      expect(result.complete).toBe(true);
      expect(game.state.status).toBe("lost");
      expect(game.isLost).toBe(true);
    });

    it("should handle unknown action", () => {
      const result = game.handleAction({ type: "unknown" });
      expect(result.success).toBe(false);
      expect(result.complete).toBe(false);
    });
  });

  describe("PatternBufferGame", () => {
    let game;

    beforeEach(() => {
      game = new PatternBufferGame(0, {});
      game.init();
    });

    it("should initialize sequence", () => {
      expect(game.state.sequence.length).toBeGreaterThan(0);
      expect(game.state.status).toBe("waiting");
    });

    it("should transition to input state", () => {
      game.handleAction({ type: "ready" });
      expect(game.state.status).toBe("displaying");

      // Fast forward time
      game.update(100000);
      expect(game.state.status).toBe("input");
    });

    it("should handle correct sequence input", () => {
      game.handleAction({ type: "ready" });
      game.update(100000); // Skip to input
      const sequence = game.state.sequence;

      for (let i = 0; i < sequence.length - 1; i++) {
        const result = game.handleAction({ type: "press", value: sequence[i] });
        expect(result.success).toBe(true);
        expect(result.complete).toBe(false);
      }

      // Last input
      const result = game.handleAction({
        type: "press",
        value: sequence[sequence.length - 1],
      });
      expect(result.success).toBe(true);
      expect(result.complete).toBe(true);
      expect(game.state.status).toBe("won");
      expect(game.isWon).toBe(true);
    });

    it("should fail on incorrect input", () => {
      game.handleAction({ type: "ready" });
      game.update(100000); // Skip to input
      const correct = game.state.sequence[0];
      const wrong = correct === 1 ? 2 : 1;

      const result = game.handleAction({ type: "press", value: wrong });
      expect(result.success).toBe(false);
      expect(result.complete).toBe(true);
      expect(game.state.status).toBe("lost");
      expect(game.isLost).toBe(true);
    });
  });

  describe("NodeOverloadGame", () => {
    let game;

    beforeEach(() => {
      game = new NodeOverloadGame(0, {});
      game.init();
    });

    it("should initialize grid with mines", () => {
      expect(game.state.grid.length).toBe(6);
      expect(game.state.mines).toBeGreaterThan(0);
    });

    it("should handle revealing a safe cell", () => {
      // Find a safe cell
      let safeX, safeY;
      for (let y = 0; y < 6; y++) {
        for (let x = 0; x < 6; x++) {
          if (!game.state.grid[y][x].isMine) {
            safeX = x;
            safeY = y;
            break;
          }
        }
        if (safeX !== undefined) break;
      }

      const result = game.handleAction({ type: "reveal", x: safeX, y: safeY });
      expect(result.success).toBe(true);
      expect(game.state.grid[safeY][safeX].isRevealed).toBe(true);
    });

    it("should lose when revealing a mine", () => {
      // Find a mine
      let mineX, mineY;
      for (let y = 0; y < 6; y++) {
        for (let x = 0; x < 6; x++) {
          if (game.state.grid[y][x].isMine) {
            mineX = x;
            mineY = y;
            break;
          }
        }
        if (mineX !== undefined) break;
      }

      const result = game.handleAction({ type: "reveal", x: mineX, y: mineY });
      expect(result.success).toBe(false);
      expect(result.complete).toBe(true);
      expect(game.state.status).toBe("lost");
      expect(game.isLost).toBe(true);
    });

    it("should flood fill when revealing a zero-neighbor cell", () => {
      // Clear all mines to ensure flood fill works across the board
      for(let y=0; y<6; y++) {
        for(let x=0; x<6; x++) {
          game.state.grid[y][x].isMine = false;
          game.state.grid[y][x].neighborMines = 0;
        }
      }
      
      // Reset game state for this scenario
      game.state.revealedCount = 0;
      game.state.targetCount = 36; // 6x6 - 0 mines
      game.state.mines = 0;

      // Reveal top-left corner
      const result = game.handleAction({ type: "reveal", x: 0, y: 0 });
      
      // Should reveal everything because they are all connected 0s
      expect(game.state.revealedCount).toBe(36);
      expect(game.state.status).toBe("won");
      expect(result.success).toBe(true);
      expect(result.complete).toBe(true);
    });
  });

  describe("DataStreamGame", () => {
    let game;

    beforeEach(() => {
      game = new DataStreamGame(0, {});
      game.init();
    });

    it("should initialize with a grid", () => {
      expect(game.state.grid.length).toBe(5);
      expect(game.state.start).toEqual({ x: 0, y: 2 });
      expect(game.state.end).toEqual({ x: 4, y: 2 });
    });

    it("should handle rotation", () => {
      // Find a non-locked tile
      const tile = game.state.grid[0][0];
      const initialRotation = tile.rotation;

      game.handleAction({ type: "rotate", x: 0, y: 0 });
      expect(game.state.grid[0][0].rotation).not.toBe(initialRotation);
      expect(game.state.moves).toBeLessThan(20);
    });

    it("should not rotate locked tiles", () => {
      const lockedTile = game.state.grid[2][0]; // Start is locked
      const initialRotation = lockedTile.rotation;

      game.handleAction({ type: "rotate", x: 0, y: 2 });
      expect(lockedTile.rotation).toBe(initialRotation);
    });
  });
});
