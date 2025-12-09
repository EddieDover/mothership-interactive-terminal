import { BaseHackingGame } from "./BaseHackingGame.js";

export class WordGuessGame extends BaseHackingGame {
  static get type() {
    return "word-guess";
  }

  init() {
    // Difficulty Logic
    // Base: 12 words
    // Bonus 35+: 10 words
    // Bonus 45+: 8 words
    // Bonus 55+: 6 words
    let wordCount = 12;
    if (this.difficulty >= 55) wordCount = 6;
    else if (this.difficulty >= 45) wordCount = 8;
    else if (this.difficulty >= 35) wordCount = 10;

    // Select words
    const allWords = HACKING_WORDS;
    const shuffled = allWords.sort(() => 0.5 - Math.random());
    const selectedWords = shuffled.slice(0, wordCount);
    const target =
      selectedWords[Math.floor(Math.random() * selectedWords.length)];

    this.state = {
      words: selectedWords.sort(),
      target: target,
      attempts: 4,
      history: [],
      bonus: this.difficulty,
      status: "active", // active, won, lost
    };
  }

  handleAction(action) {
    if (this.state.status !== "active")
      return { success: false, complete: true };

    const word = action.word;
    if (!word) return { success: false, complete: false };

    // Calculate likeness
    let likeness = 0;
    for (let i = 0; i < word.length; i++) {
      if (word[i] === this.state.target[i]) likeness++;
    }

    this.state.history.push({
      word: word,
      likeness: likeness,
    });

    if (word === this.state.target) {
      this.state.status = "won";
      return {
        success: true,
        complete: true,
        message: game.i18n.localize("FVTT-MII.Hacking.WordGuess.Won"),
      };
    } else {
      this.state.attempts--;
      if (this.state.attempts <= 0) {
        this.state.status = "lost";
        return {
          success: false,
          complete: true,
          message: game.i18n.localize("FVTT-MII.Hacking.WordGuess.Lost"),
        };
      }
      return {
        success: false,
        complete: false,
        message: game.i18n.localize("FVTT-MII.Hacking.WordGuess.Denied"),
      };
    }
  }

  get isWon() {
    return this.state.status === "won";
  }

  get isLost() {
    return this.state.status === "lost";
  }
}

const HACKING_WORDS = [
  "SYSTEM",
  "ACCESS",
  "BUFFER",
  "CODING",
  "DAEMON",
  "ENCODE",
  "FILTER",
  "GOPHER",
  "HACKER",
  "INPUTS",
  "JARGON",
  "KERNEL",
  "LOGINS",
  "MATRIX",
  "NETWRK",
  "OUTPUT",
  "PARSER",
  "QUERY",
  "ROUTER",
  "SERVER",
  "TELNET",
  "UPLOAD",
  "VECTOR",
  "WIDGET",
  "SYNTAX",
  "MEMORY",
  "BACKUP",
  "CONFIG",
  "DEVICE",
  "ERRORS",
  "FORMAT",
  "GLOBAL",
  "HEADER",
  "INLINE",
  "JUMPER",
  "KEYPAD",
  "LINKER",
  "MODULE",
  "NATIVE",
  "OBJECT",
  "PACKET",
  "QUEUES",
  "REBOOT",
  "SCRIPT",
  "TARGET",
  "UPDATE",
  "VERIFY",
  "WINDOW",
];
