import { MAX_GUESSES } from './evaluate';

export interface Stats {
  played: number;
  wins: number;
  /** Wins by number of guesses: index 0 is a win in 1, index 5 a win in 6. */
  distribution: number[];
  currentStreak: number;
  maxStreak: number;
  /** Puzzle day of the most recent win, used to tell whether the streak is still alive. */
  lastWonDay: number | null;
  /** Latest puzzle day already counted, so a day can never be counted twice. */
  lastCountedDay: number | null;
}

export const EMPTY_STATS: Stats = {
  played: 0,
  wins: 0,
  distribution: Array(MAX_GUESSES).fill(0),
  currentStreak: 0,
  maxStreak: 0,
  lastWonDay: null,
  lastCountedDay: null,
};

/** Records a finished game. `guessCount` is only used for wins. */
export function recordResult(stats: Stats, day: number, won: boolean, guessCount: number): Stats {
  if (stats.lastCountedDay !== null && day <= stats.lastCountedDay) return stats;

  const next: Stats = { ...stats, distribution: [...stats.distribution], played: stats.played + 1, lastCountedDay: day };

  if (won) {
    next.wins += 1;
    next.distribution[guessCount - 1] += 1;
    next.currentStreak = stats.lastWonDay === day - 1 ? stats.currentStreak + 1 : 1;
    next.maxStreak = Math.max(stats.maxStreak, next.currentStreak);
    next.lastWonDay = day;
  } else {
    next.currentStreak = 0;
  }

  return next;
}

/** The streak as it stands today: it has lapsed if neither today nor yesterday was won. */
export function displayedStreak(stats: Stats, today: number): number {
  if (stats.lastWonDay === null || stats.lastWonDay < today - 1) return 0;
  return stats.currentStreak;
}

export function winPercent(stats: Stats): number {
  return stats.played === 0 ? 0 : Math.round((stats.wins / stats.played) * 100);
}

export interface ImportInput {
  played: number;
  currentStreak: number;
  maxStreak: number;
  distribution: number[];
  /** True if the numbers already include today's puzzle. */
  includesToday: boolean;
}

export function validateImport(input: ImportInput): string | null {
  const numbers = [input.played, input.currentStreak, input.maxStreak, ...input.distribution];
  if (input.distribution.length !== MAX_GUESSES || numbers.some((n) => !Number.isInteger(n) || n < 0)) {
    return 'Use whole numbers of 0 or more';
  }
  const wins = input.distribution.reduce((a, b) => a + b, 0);
  if (wins > input.played) return 'Total wins (rows 1 to 6) cannot be more than Played';
  if (input.currentStreak > input.maxStreak) return 'Current streak cannot be more than max streak';
  if (input.maxStreak > wins) return 'Max streak cannot be more than total wins';
  return null;
}

/** Builds stats from imported numbers so the streak carries on from today or yesterday. */
export function importStats(input: ImportInput, today: number): Stats {
  const lastDay = input.includesToday ? today : today - 1;
  return {
    played: input.played,
    wins: input.distribution.reduce((a, b) => a + b, 0),
    distribution: [...input.distribution],
    currentStreak: input.currentStreak,
    maxStreak: input.maxStreak,
    lastWonDay: input.currentStreak > 0 ? lastDay : null,
    lastCountedDay: input.played > 0 ? lastDay : null,
  };
}
