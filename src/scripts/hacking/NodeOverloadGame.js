import { BaseHackingGame } from "./BaseHackingGame.js";

export class NodeOverloadGame extends BaseHackingGame {
  static get type() {
    return "node-overload";
  }

  init() {
    const size = 6;
    // Base 12 mines, -1 per 8 skill points, min 3
    // Score 20: 10 mines (Hard) | Score 37: 8 mines (Normal) | Score 60: 5 mines (Easy)
    const mineCount = Math.max(3, 12 - Math.floor(this.difficulty / 8));

    this.state = {
      grid: [],
      size: size,
      mines: mineCount,
      revealedCount: 0,
      targetCount: size * size - mineCount,
      status: "active",
    };

    // Initialize grid
    for (let y = 0; y < size; y++) {
      const row = [];
      for (let x = 0; x < size; x++) {
        row.push({
          x,
          y,
          isMine: false,
          isRevealed: false,
          neighborMines: 0,
        });
      }
      this.state.grid.push(row);
    }

    // Place mines
    let placed = 0;
    while (placed < mineCount) {
      const x = Math.floor(Math.random() * size);
      const y = Math.floor(Math.random() * size);
      if (!this.state.grid[y][x].isMine) {
        this.state.grid[y][x].isMine = true;
        placed++;
      }
    }

    // Calculate neighbors
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (!this.state.grid[y][x].isMine) {
          this.state.grid[y][x].neighborMines = this._countNeighbors(x, y);
        }
      }
    }
  }

  _countNeighbors(x, y) {
    let count = 0;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const ny = y + dy;
        const nx = x + dx;
        if (
          ny >= 0 &&
          ny < this.state.size &&
          nx >= 0 &&
          nx < this.state.size
        ) {
          if (this.state.grid[ny][nx].isMine) count++;
        }
      }
    }
    return count;
  }

  _floodFill(x, y) {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const ny = y + dy;
        const nx = x + dx;

        if (
          ny >= 0 &&
          ny < this.state.size &&
          nx >= 0 &&
          nx < this.state.size
        ) {
          const neighbor = this.state.grid[ny][nx];
          if (!neighbor.isRevealed && !neighbor.isMine) {
            neighbor.isRevealed = true;
            this.state.revealedCount++;
            if (neighbor.neighborMines === 0) {
              this._floodFill(nx, ny);
            }
          }
        }
      }
    }
  }

  handleAction(action) {
    if (this.state.status !== "active")
      return { success: false, complete: true };

    if (action.type === "reveal") {
      const { x, y } = action;
      const cell = this.state.grid[y][x];

      if (cell.isRevealed) return { success: false, complete: false };

      cell.isRevealed = true;

      if (cell.isMine) {
        this.state.status = "lost";
        return {
          success: false,
          complete: true,
          message: game.i18n.localize("FVTT-MII.Hacking.NodeOverload.Lost"),
        };
      }

      this.state.revealedCount++;

      if (cell.neighborMines === 0) {
        this._floodFill(x, y);
      }

      if (this.state.revealedCount >= this.state.targetCount) {
        this.state.status = "won";
        return {
          success: true,
          complete: true,
          message: game.i18n.localize("FVTT-MII.Hacking.NodeOverload.Won"),
        };
      }
    }
    return { success: true, complete: false };
  }

  get isWon() {
    return this.state.status === "won";
  }
  get isLost() {
    return this.state.status === "lost";
  }
}
