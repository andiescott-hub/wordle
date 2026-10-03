const DAY_MS = 86_400_000;

// Wordle #0 was published on 19 June 2021. NYT numbers each puzzle by days since then.
const EPOCH_UTC = Date.UTC(2021, 5, 19);

/**
 * Index of the puzzle for the given moment in the player's local time zone.
 * Uses the local calendar date with UTC arithmetic so DST changes never shift the count.
 */
export function dayIndex(date: Date = new Date()): number {
  const localMidnightUtc = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.round((localMidnightUtc - EPOCH_UTC) / DAY_MS);
}

/** Milliseconds from `date` until the next local midnight, when the puzzle changes. */
export function msUntilNextDay(date: Date = new Date()): number {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
  return next.getTime() - date.getTime();
}

/** Formats a duration as HH:MM:SS for the "Next Wordle" countdown. */
export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
}
