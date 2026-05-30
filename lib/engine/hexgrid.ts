import { DC, LVL_DOORS, SFILL } from "./constants";
import type { DoorKey, Level } from "./types";

// ── HEX GRID MATH (pointy-top, 10×10) ──
export const R = 36;
export const W = Math.sqrt(3) * R;
export const H = 2 * R;
export const HP = W;
export const VP = H * 0.75;
export const OO = W / 2;
export const PAD = 8;

export const SVG_W = Math.ceil(9 * HP + OO + W + PAD * 2);
export const SVG_H = Math.ceil(9 * VP + H + PAD * 2);

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

export function hexSym(n: number): string {
  if (n % 10 === 0) return "💎";
  if (n % 10 === 5) return "🚧";
  if (n % 10 === 6) return "🦹";
  if (isPrime(n)) return "🎲";
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
  const map: Record<string, DoorKey> = {};
  for (let h = 1; h <= 100; h++) {
    for (let e = 0; e < 6; e++) {
      const nb = hNeighbor(h, e);
      if (nb && nb > h) {
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
