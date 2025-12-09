import { BruteForceGame } from "./BruteForceGame.js";
import { DataStreamGame } from "./DataStreamGame.js";
import { NodeOverloadGame } from "./NodeOverloadGame.js";
import { PatternBufferGame } from "./PatternBufferGame.js";
import { SignalInjectionGame } from "./SignalInjectionGame.js";
import { WordGuessGame } from "./WordGuessGame.js";

export class HackingGameRegistry {
  static get games() {
    return {
      "word-guess": WordGuessGame,
      "signal-injection": SignalInjectionGame,
      "data-stream": DataStreamGame,
      "node-overload": NodeOverloadGame,
      "brute-force": BruteForceGame,
      "pattern-buffer": PatternBufferGame,
    };
  }

  static create(type, difficulty, context) {
    const GameClass = this.games[type];
    if (!GameClass) {
      console.warn(
        `Hacking game type '${type}' not found, falling back to 'word-guess'`
      );
      return new WordGuessGame(difficulty, context);
    }
    const game = new GameClass(difficulty, context);
    game.init();
    return game;
  }

  static restore(type, state, context) {
    const GameClass = this.games[type];
    if (!GameClass) return null;

    const game = new GameClass(0, context);
    game.restore(state);
    return game;
  }

  static getTypes() {
    return Object.keys(this.games);
  }
}
