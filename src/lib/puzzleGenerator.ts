// Deterministic puzzle generator for Daily Zip
// Generates 1000 unique levels using seeded Hamiltonian paths

class SeededRandom {
  private s: number;
  constructor(seed: number) {
    this.s = seed % 2147483647;
    if (this.s <= 0) this.s += 2147483646;
  }
  next(): number {
    this.s = (this.s * 16807) % 2147483647;
    return (this.s - 1) / 2147483646;
  }
  nextInt(max: number): number {
    return Math.floor(this.next() * max);
  }
}

export interface Cell {
  row: number;
  col: number;
}

export interface Waypoint extends Cell {
  value: number;
  pathIndex: number;
}

export interface PuzzleData {
  level: number;
  gridSize: number;
  difficulty: string;
  path: Cell[];
  waypoints: Waypoint[];
  totalCells: number;
}

export function getGridSize(level: number): number {
  if (level <= 100) return 5;
  if (level <= 300) return 6;
  if (level <= 700) return 7;
  return 8;
}

export function getDifficulty(level: number): string {
  if (level <= 100) return "Easy";
  if (level <= 300) return "Medium";
  if (level <= 700) return "Hard";
  return "Expert";
}

function getWaypointCount(level: number, gridSize: number): number {
  // More waypoints = easier. Decrease as level increases within range.
  if (gridSize === 5) return Math.max(4, 7 - Math.floor((level - 1) / 20));
  if (gridSize === 6) return Math.max(5, 9 - Math.floor((level - 101) / 40));
  if (gridSize === 7) return Math.max(6, 11 - Math.floor((level - 301) / 60));
  return Math.max(7, 13 - Math.floor((level - 701) / 50));
}

function countUnvisited(row: number, col: number, size: number, visited: boolean[][]): number {
  let count = 0;
  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  for (const [dr, dc] of dirs) {
    const nr = row + dr, nc = col + dc;
    if (nr >= 0 && nr < size && nc >= 0 && nc < size && !visited[nr][nc]) count++;
  }
  return count;
}

function generateHamiltonianPath(size: number, rng: SeededRandom): Cell[] | null {
  const total = size * size;
  const visited = Array.from({ length: size }, () => Array(size).fill(false));
  const path: Cell[] = [];

  const startRow = rng.nextInt(size);
  const startCol = rng.nextInt(size);

  function dfs(row: number, col: number): boolean {
    visited[row][col] = true;
    path.push({ row, col });
    if (path.length === total) return true;

    const dirs: [number, number][] = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    // Shuffle directions
    for (let i = dirs.length - 1; i > 0; i--) {
      const j = rng.nextInt(i + 1);
      [dirs[i], dirs[j]] = [dirs[j], dirs[i]];
    }

    // Get valid unvisited neighbors
    const neighbors: Cell[] = [];
    for (const [dr, dc] of dirs) {
      const nr = row + dr, nc = col + dc;
      if (nr >= 0 && nr < size && nc >= 0 && nc < size && !visited[nr][nc]) {
        neighbors.push({ row: nr, col: nc });
      }
    }

    // Sort by Warnsdorff's heuristic (fewest onward moves first)
    neighbors.sort((a, b) => {
      const ca = countUnvisited(a.row, a.col, size, visited);
      const cb = countUnvisited(b.row, b.col, size, visited);
      if (ca !== cb) return ca - cb;
      return rng.next() - 0.5; // Random tie-break
    });

    for (const next of neighbors) {
      if (dfs(next.row, next.col)) return true;
    }

    visited[row][col] = false;
    path.pop();
    return false;
  }

  if (dfs(startRow, startCol)) return path;
  return null;
}

function generateSerpentinePath(size: number): Cell[] {
  const path: Cell[] = [];
  for (let r = 0; r < size; r++) {
    if (r % 2 === 0) {
      for (let c = 0; c < size; c++) path.push({ row: r, col: c });
    } else {
      for (let c = size - 1; c >= 0; c--) path.push({ row: r, col: c });
    }
  }
  return path;
}

export function generatePuzzle(level: number): PuzzleData {
  const gridSize = getGridSize(level);
  const difficulty = getDifficulty(level);
  const totalCells = gridSize * gridSize;

  // Try multiple seeds to find a valid Hamiltonian path
  let path: Cell[] | null = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    const rng = new SeededRandom(level * 31337 + attempt * 7919);
    path = generateHamiltonianPath(gridSize, rng);
    if (path) break;
  }

  // Fallback to serpentine
  if (!path) {
    path = generateSerpentinePath(gridSize);
  }

  // Place waypoints along the path
  const waypointCount = getWaypointCount(level, gridSize);
  const rng = new SeededRandom(level * 12345);

  const waypointIndices = new Set<number>([0, totalCells - 1]);
  const step = Math.floor(totalCells / (waypointCount - 1));
  for (let i = 1; i < waypointCount - 1; i++) {
    let idx = i * step + rng.nextInt(Math.max(1, Math.floor(step / 4))) - Math.floor(step / 8);
    idx = Math.max(1, Math.min(totalCells - 2, idx));
    waypointIndices.add(idx);
  }

  const sortedIndices = Array.from(waypointIndices).sort((a, b) => a - b);
  const waypoints: Waypoint[] = sortedIndices.map((idx, i) => ({
    ...path![idx],
    value: i + 1,
    pathIndex: idx,
  }));

  return { level, gridSize, difficulty, path, waypoints, totalCells };
}

// Generate a daily challenge puzzle based on the date
export function generateDailyPuzzle(): PuzzleData {
  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  // Daily puzzles use medium difficulty (6x6)
  const gridSize = 6;
  const totalCells = gridSize * gridSize;

  let path: Cell[] | null = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    const rng = new SeededRandom(seed * 99991 + attempt * 3571);
    path = generateHamiltonianPath(gridSize, rng);
    if (path) break;
  }
  if (!path) path = generateSerpentinePath(gridSize);

  const rng = new SeededRandom(seed * 54321);
  const waypointCount = 6;
  const waypointIndices = new Set<number>([0, totalCells - 1]);
  const step = Math.floor(totalCells / (waypointCount - 1));
  for (let i = 1; i < waypointCount - 1; i++) {
    let idx = i * step + rng.nextInt(Math.max(1, Math.floor(step / 4)));
    idx = Math.max(1, Math.min(totalCells - 2, idx));
    waypointIndices.add(idx);
  }
  const sortedIndices = Array.from(waypointIndices).sort((a, b) => a - b);
  const waypoints: Waypoint[] = sortedIndices.map((idx, i) => ({
    ...path![idx],
    value: i + 1,
    pathIndex: idx,
  }));

  return { level: 0, gridSize, difficulty: "Daily", path, waypoints, totalCells };
}
