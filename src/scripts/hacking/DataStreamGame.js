import { BaseHackingGame } from "./BaseHackingGame.js";

export class DataStreamGame extends BaseHackingGame {
  static get type() {
    return "data-stream";
  }

  init() {
    // Grid size 5x5
    this.gridSize = 5;
    // Base 15 moves, +1 per 4 skill points
    // Score 20: 20 moves | Score 37: 24 moves | Score 60: 30 moves
    const moves = 15 + Math.floor(this.difficulty / 4);

    this.state = {
      grid: [],
      start: { x: 0, y: 2 },
      end: { x: 4, y: 2 },
      status: "active",
      moves: moves,
    };

    this._generateSolvableGrid();
    this._updateFlow();
  }

  _generateSolvableGrid() {
    // 1. Initialize empty grid
    const grid = [];
    for (let y = 0; y < this.gridSize; y++) {
      const row = [];
      for (let x = 0; x < this.gridSize; x++) {
        row.push({
          x,
          y,
          type: null,
          rotation: 0,
          locked: (x === 0 && y === 2) || (x === 4 && y === 2),
          isStart: x === 0 && y === 2,
          isEnd: x === 4 && y === 2,
          powered: false,
        });
      }
      grid.push(row);
    }

    // 2. Generate Path from (0,2) to (4,2)
    let success = false;
    let path = [];
    let attempts = 0;

    while (!success && attempts < 100) {
      attempts++;
      path = [{ x: 0, y: 2 }];
      let visited = new Set(["0,2"]);
      let currX = 0;
      let currY = 2;
      let stuck = false;

      while (true) {
        let moves = [];

        // If at start, must go Right
        if (currX === 0 && currY === 2) {
          moves.push({ x: 1, y: 2 });
        } else {
          const candidates = [
            { x: currX, y: currY - 1 }, // Up
            { x: currX, y: currY + 1 }, // Down
            { x: currX - 1, y: currY }, // Left
            { x: currX + 1, y: currY }, // Right
          ];

          for (const c of candidates) {
            if (
              c.x < 0 ||
              c.x >= this.gridSize ||
              c.y < 0 ||
              c.y >= this.gridSize
            )
              continue;
            if (visited.has(`${c.x},${c.y}`)) continue;

            // Target check: Can only enter (4,2) from (3,2)
            if (c.x === 4 && c.y === 2) {
              if (currX === 3 && currY === 2) {
                moves.push(c);
              }
              continue;
            }
            moves.push(c);
          }
        }

        if (moves.length === 0) {
          stuck = true;
          break;
        }

        const move = moves[Math.floor(Math.random() * moves.length)];
        path.push(move);
        visited.add(`${move.x},${move.y}`);
        currX = move.x;
        currY = move.y;

        if (currX === 4 && currY === 2) {
          success = true;
          break;
        }
      }
    }

    // 3. Assign types based on path
    for (let i = 0; i < path.length; i++) {
      const node = path[i];
      const cell = grid[node.y][node.x];

      if (cell.locked) {
        cell.type = "straight";
        cell.rotation = 90;
        continue;
      }

      const prev = path[i - 1];
      const next = path[i + 1];

      let entryDir, exitDir;

      // Determine entry direction (from prev to node)
      if (prev.x < node.x)
        entryDir = 270; // From Left
      else if (prev.x > node.x)
        entryDir = 90; // From Right
      else if (prev.y < node.y)
        entryDir = 0; // From Up
      else if (prev.y > node.y) entryDir = 180; // From Down

      // Determine exit direction (from node to next)
      if (next.x > node.x)
        exitDir = 90; // To Right
      else if (next.x < node.x)
        exitDir = 270; // To Left
      else if (next.y > node.y)
        exitDir = 180; // To Down
      else if (next.y < node.y) exitDir = 0; // To Up

      const diff = Math.abs(entryDir - exitDir);
      if (diff === 180) {
        cell.type = "straight";
        cell.rotation = entryDir === 90 || entryDir === 270 ? 90 : 0;
      } else {
        cell.type = "corner";
        const dirs = [entryDir, exitDir].sort((a, b) => a - b);
        if (dirs[0] === 0 && dirs[1] === 90) cell.rotation = 0;
        else if (dirs[0] === 90 && dirs[1] === 180) cell.rotation = 90;
        else if (dirs[0] === 180 && dirs[1] === 270) cell.rotation = 180;
        else if (dirs[0] === 0 && dirs[1] === 270) cell.rotation = 270;
      }
    }

    // 4. Fill remaining cells
    const types = ["straight", "corner", "tee"];
    for (let y = 0; y < this.gridSize; y++) {
      for (let x = 0; x < this.gridSize; x++) {
        const cell = grid[y][x];
        if (cell.type === null) {
          cell.type = types[Math.floor(Math.random() * types.length)];
          cell.rotation = Math.floor(Math.random() * 4) * 90;
        }
      }
    }

    // 5. Scramble rotations (except locked)
    for (let y = 0; y < this.gridSize; y++) {
      for (let x = 0; x < this.gridSize; x++) {
        const cell = grid[y][x];
        if (!cell.locked) {
          cell.rotation = Math.floor(Math.random() * 4) * 90;
        }
      }
    }

    this.state.grid = grid;
  }

  handleAction(action) {
    if (this.state.status !== "active")
      return { success: false, complete: true };

    if (action.type === "rotate") {
      const { x, y } = action;
      const tile = this.state.grid[y][x];

      if (tile.locked) return { success: false, complete: false };

      tile.rotation = (tile.rotation + 90) % 360;
      this.state.moves--;

      const connected = this._updateFlow();

      if (connected) {
        this.state.status = "won";
        return {
          success: true,
          complete: true,
          message: game.i18n.localize("FVTT-MII.Hacking.DataStream.Won"),
        };
      }

      if (this.state.moves <= 0) {
        this.state.status = "lost";
        return {
          success: false,
          complete: true,
          message: game.i18n.localize("FVTT-MII.Hacking.DataStream.Lost"),
        };
      }
    }
    return { success: true, complete: false };
  }

  _updateFlow() {
    // Reset all powered states
    for (let y = 0; y < this.gridSize; y++) {
      for (let x = 0; x < this.gridSize; x++) {
        this.state.grid[y][x].powered = false;
      }
    }

    // BFS from start
    const startNode = this.state.start;
    const endNode = this.state.end;
    const queue = [startNode];
    const visited = new Set();
    visited.add(`${startNode.x},${startNode.y}`);

    this.state.grid[startNode.y][startNode.x].powered = true;

    let connectedToEnd = false;

    while (queue.length > 0) {
      const current = queue.shift();

      if (current.x === endNode.x && current.y === endNode.y) {
        connectedToEnd = true;
      }

      const neighbors = this._getConnectedNeighbors(current.x, current.y);

      for (const n of neighbors) {
        const key = `${n.x},${n.y}`;
        if (!visited.has(key)) {
          visited.add(key);
          this.state.grid[n.y][n.x].powered = true;
          queue.push(n);
        }
      }
    }

    return connectedToEnd;
  }

  _checkConnection() {
    return this._updateFlow();
  }

  _getConnectedNeighbors(x, y) {
    const neighbors = [];
    const tile = this.state.grid[y][x];
    const dirs = this._getOpenDirections(tile.type, tile.rotation);

    // Check each direction
    // Up (0)
    if (dirs.includes(0) && y > 0) {
      const next = this.state.grid[y - 1][x];
      const nextDirs = this._getOpenDirections(next.type, next.rotation);
      if (nextDirs.includes(180)) neighbors.push({ x, y: y - 1 });
    }
    // Right (90)
    if (dirs.includes(90) && x < this.gridSize - 1) {
      const next = this.state.grid[y][x + 1];
      const nextDirs = this._getOpenDirections(next.type, next.rotation);
      if (nextDirs.includes(270)) neighbors.push({ x: x + 1, y });
    }
    // Down (180)
    if (dirs.includes(180) && y < this.gridSize - 1) {
      const next = this.state.grid[y + 1][x];
      const nextDirs = this._getOpenDirections(next.type, next.rotation);
      if (nextDirs.includes(0)) neighbors.push({ x, y: y + 1 });
    }
    // Left (270)
    if (dirs.includes(270) && x > 0) {
      const next = this.state.grid[y][x - 1];
      const nextDirs = this._getOpenDirections(next.type, next.rotation);
      if (nextDirs.includes(90)) neighbors.push({ x: x - 1, y });
    }

    return neighbors;
  }

  _getOpenDirections(type, rotation) {
    // Base directions for 0 rotation
    let base = [];
    if (type === "straight") base = [0, 180];
    else if (type === "corner") base = [0, 90];
    else if (type === "tee")
      base = [0, 90, 270]; // Up, Right, Left (matches ┴)
    else if (type === "cross") base = [0, 90, 180, 270];

    // Apply rotation
    return base.map((d) => (d + rotation) % 360);
  }

  get isWon() {
    return this.state.status === "won";
  }
  get isLost() {
    return this.state.status === "lost";
  }
}
