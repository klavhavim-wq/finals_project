import type { TrialRecord } from "./engine/types";

export interface PlayerStats {
  /** number of distinct items the player faced (first attempts) */
  total: number;
  /** items answered correctly on the first attempt */
  correct: number;
  accuracyPct: number;
  /** median response time (seconds) of clean retrievals: first attempt, correct, no hint, no reveal */
  medianRtSec: number | null;
}

function median(sorted: number[]): number {
  const n = sorted.length;
  if (!n) return 0;
  return n % 2 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
}

/**
 * The clean skill measure: first-attempt accuracy, and median response time on
 * items retrieved cleanly (first attempt, correct, no hint, no reveal). This is
 * the chronometric signal — far less noisy than the pellet score.
 */
export function statsForPlayer(trials: TrialRecord[] | undefined, player: string): PlayerStats {
  const first = (trials ?? []).filter((t) => t.player === player && t.attempt === 1);
  const total = first.length;
  const correct = first.filter((t) => t.correct).length;
  const clean = first
    .filter((t) => t.correct && !t.hintUsed && !t.revealed)
    .map((t) => t.rtMs)
    .sort((a, b) => a - b);
  const medianRtSec = clean.length ? +(median(clean) / 1000).toFixed(1) : null;
  return {
    total,
    correct,
    accuracyPct: total ? Math.round((correct / total) * 100) : 0,
    medianRtSec,
  };
}
