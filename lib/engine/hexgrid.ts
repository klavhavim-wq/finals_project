import { boardMaxFor, boardRowsFor, DC, LVL_DOORS, SFILL } from "./constants";
import type { DoorKey, Level } from "./types";

// ── HEX GRID MATH (pointy-top, 10 columns, rows vary per level) ──
export const R = 36;
export const W = Math.sqrt(3) * R;
export const H = 2 * R;
export const HP = W;
export const VP = H * 0.75;
export const OO = W / 2;
export const PAD = 8;

// Full-size board (10 rows) — kept for any non-level-specific use.
export const SVG_W = Math.ceil(9 * HP + OO + W + PAD * 2);
export const SVG_H = Math.ceil(9 * VP + H + PAD * 2);

/** SVG canvas size for a level's board (10 wide, rows depend on level). */
export function boardSvgSize(level: Level): { w: number; h: number } {
  const rows = boardRowsFor(level);
  return {
    w: Math.ceil(9 * HP + OO + W + PAD * 2),
    h: Math.ceil((rows - 1) * VP + H + PAD * 2),
  };
}

export interface Point {
  x: number;
  y: number;
}

export function hCenter(n: number): Point {
  const row = Math.floor((n - 1) / 10);
  const col = (n - 1) % 10;
  return {
    x: col * HP + (row % 2 ? OO : 0) + W / 2 + PAD,
    y: row * VP + R + PAD,
  };
}

export function hVerts(cx: number, cy: number): Point[] {
  const v: Point[] = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i - Math.PI / 2;
    v.push({ x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) });
  }
  return v;
}

const EDIRS_EVEN = [
  [-1, 0],
  [0, 1],
  [1, 0],
  [1, -1],
  [0, -1],
  [-1, -1],
];
const EDIRS_ODD = [
  [-1, 1],
  [0, 1],
  [1, 1],
  [1, 0],
  [0, -1],
  [-1, 0],
];

export function hNeighbor(n: number, e: number): number | null {
  const row = Math.floor((n - 1) / 10);
  const col = (n - 1) % 10;
  const [dr, dc] = (row % 2 ? EDIRS_ODD : EDIRS_EVEN)[e];
  const nr = row + dr;
  const nc = col + dc;
  if (nr < 0 || nr >= 10 || nc < 0 || nc >= 10) return null;
  return nr * 10 + nc + 1;
}

export function hNeighbors(n: number): (number | null)[] {
  return [0, 1, 2, 3, 4, 5].map((e) => hNeighbor(n, e));
}

export function isPrime(n: number): boolean {
  if (n < 2) return false;
  for (let i = 2; i <= Math.sqrt(n); i++) if (n % i === 0) return false;
  return true;
}

/**
 * Shortest connected walk from `from` to `to` over adjacent hexes, within the
 * level's board. Returns the hexes after `from` up to and including `to`
 * (empty if unreachable). Used by the guided demo to draw a sample route.
 */
export function findPath(level: Level, from: number, to: number): number[] {
  if (from === to) return [];
  const max = boardMaxFor(level);
  const prev = new Map<number, number>([[from, -1]]);
  const queue = [from];
  while (queue.length) {
    const cur = queue.shift()!;
    if (cur === to) break;
    for (const nb of hNeighbors(cur)) {
      if (nb == null || nb < 1 || nb > max || prev.has(nb)) continue;
      prev.set(nb, cur);
      queue.push(nb);
    }
  }
  if (!prev.has(to)) return [];
  const path: number[] = [];
  for (let c = to; c !== from; c = prev.get(c)!) path.push(c);
  return path.reverse();
}

/** Proper factor tiles of n that sit on the board: divisors d with 2 ≤ d < n. */
export function factorTilesOf(n: number, boardMax: number): number[] {
  const out: number[] = [];
  for (let d = 2; d < n && d <= boardMax; d++) {
    if (n % d === 0) out.push(d);
  }
  return out;
}

/** Whether n can be broken into a factor pair a×b with a,b ≥ 2 (i.e. composite). */
export function hasFactorPair(n: number): boolean {
  return n >= 4 && !isPrime(n);
}

export function hexSym(n: number): string {
  if (n % 10 === 0) return "💎";
  if (n % 10 === 6) return "🦹";
  // Primes draw a Twist (checked before the "ends in 5" limit rule so that 5,
  // the only prime ending in 5, matches the instructions and gets a Twist).
  if (isPrime(n)) return "🎲";
  if (n % 10 === 5) return "🚧";
  return "";
}

export function hexBaseFill(n: number): string {
  const s = hexSym(n);
  if (s === "💎") return SFILL.bonus;
  if (s === "🚧") return SFILL.limit;
  if (s === "🦹") return SFILL.rob;
  if (s === "🎲") return SFILL.twist;
  return SFILL.normal;
}

export function initEdgeColors(level: Level): Record<string, DoorKey> {
  const doors = LVL_DOORS[level];
  const n = doors.length;
  const max = boardMaxFor(level);
  const map: Record<string, DoorKey> = {};
  for (let h = 1; h <= max; h++) {
    for (let e = 0; e < 6; e++) {
      const nb = hNeighbor(h, e);
      if (nb && nb > h && nb <= max) {
        const key = h + "-" + nb;
        const hash = ((h * 2017 + nb * 1013) % 97 + 97) % 97;
        map[key] = doors[hash % n];
      }
    }
  }
  return map;
}

export function edgeColor(
  edgeColors: Record<string, DoorKey>,
  level: Level,
  a: number,
  b: number
): DoorKey {
  return (
    edgeColors[Math.min(a, b) + "-" + Math.max(a, b)] || LVL_DOORS[level][0]
  );
}

/** Door stroke color for an edge. */
export function edgeStroke(
  edgeColors: Record<string, DoorKey>,
  level: Level,
  a: number,
  b: number
): string {
  return DC[edgeColor(edgeColors, level, a, b)].color;
}
