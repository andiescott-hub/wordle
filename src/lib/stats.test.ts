import { describe, expect, it } from 'vitest';
import { EMPTY_STATS, displayedStreak, importStats, recordResult, validateImport, winPercent } from './stats';

describe('recordResult', () => {
  it('builds a streak over consecutive days', () => {
    let s = recordResult(EMPTY_STATS, 100, true, 3);
    s = recordResult(s, 101, true, 4);
    expect(s).toMatchObject({ played: 2, wins: 2, currentStreak: 2, maxStreak: 2, lastWonDay: 101 });
    expect(s.distribution).toEqual([0, 0, 1, 1, 0, 0]);
  });

  it('restarts the streak at 1 after a missed day', () => {
    let s = recordResult(EMPTY_STATS, 100, true, 3);
    s = recordResult(s, 101, true, 3);
    s = recordResult(s, 103, true, 2);
    expect(s.currentStreak).toBe(1);
    expect(s.maxStreak).toBe(2);
  });

  it('resets the streak on a loss and counts it as played', () => {
    let s = recordResult(EMPTY_STATS, 100, true, 3);
    s = recordResult(s, 101, false, 6);
    expect(s).toMatchObject({ played: 2, wins: 1, currentStreak: 0, maxStreak: 1 });
    expect(winPercent(s)).toBe(50);
  });

  it('never counts the same day twice', () => {
    const s = recordResult(EMPTY_STATS, 100, true, 3);
    expect(recordResult(s, 100, true, 3)).toBe(s);
    expect(recordResult(s, 99, false, 6)).toBe(s);
  });
});

describe('displayedStreak', () => {
  it('shows the streak while today or yesterday was won, otherwise 0', () => {
    const s = recordResult(EMPTY_STATS, 100, true, 3);
    expect(displayedStreak(s, 100)).toBe(1);
    expect(displayedStreak(s, 101)).toBe(1);
    expect(displayedStreak(s, 102)).toBe(0);
  });
});

describe('importStats', () => {
  // The user's NYT stats from the screenshot, taken after today's win.
  const nyt = { played: 1638, currentStreak: 13, maxStreak: 98, distribution: [1, 89, 465, 622, 311, 114] };

  it('validates the screenshot numbers and computes 98%', () => {
    expect(validateImport({ ...nyt, includesToday: true })).toBeNull();
    expect(winPercent(importStats({ ...nyt, includesToday: true }, 1932))).toBe(98);
  });

  it('includes today: today is not counted again and tomorrow extends the streak', () => {
    const s = importStats({ ...nyt, includesToday: true }, 1932);
    expect(recordResult(s, 1932, true, 4)).toBe(s);
    const tomorrow = recordResult(s, 1933, true, 4);
    expect(tomorrow).toMatchObject({ played: 1639, currentStreak: 14, maxStreak: 98 });
  });

  it('excludes today: playing today extends the streak', () => {
    const s = importStats(
      { played: 1637, currentStreak: 12, maxStreak: 98, distribution: [1, 89, 465, 622, 310, 114], includesToday: false },
      1932,
    );
    expect(displayedStreak(s, 1932)).toBe(12);
    const after = recordResult(s, 1932, true, 5);
    expect(after).toMatchObject({ played: 1638, wins: 1602, currentStreak: 13 });
    expect(after.distribution).toEqual(nyt.distribution);
  });

  it('rejects impossible numbers', () => {
    expect(validateImport({ ...nyt, played: 10, includesToday: true })).toMatch(/Played/);
    expect(validateImport({ ...nyt, currentStreak: 99, includesToday: true })).toMatch(/max streak/);
    expect(validateImport({ ...nyt, played: 1.5, includesToday: true })).toMatch(/whole numbers/);
  });
});
