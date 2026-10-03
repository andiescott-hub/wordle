import { describe, expect, it } from 'vitest';
import { answerForDay, answerOrder } from './answer';
import { dayIndex, formatCountdown, msUntilNextDay } from './date';
import ANSWERS from '../data/answers';
import GUESSES from '../data/guesses';

describe('dayIndex', () => {
  it('numbers puzzles like NYT', () => {
    expect(dayIndex(new Date(2021, 5, 19, 12))).toBe(0);
    expect(dayIndex(new Date(2026, 9, 3, 11, 17))).toBe(1932);
  });

  it('changes at local midnight', () => {
    expect(dayIndex(new Date(2026, 9, 3, 23, 59, 59))).toBe(1932);
    expect(dayIndex(new Date(2026, 9, 4, 0, 0, 0))).toBe(1933);
  });

  it('stays one per day across DST changes', () => {
    // Covers both northern and southern hemisphere DST dates whatever TZ the tests run in.
    for (let d = new Date(2026, 0, 1); d.getFullYear() === 2026; d.setDate(d.getDate() + 1)) {
      const next = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
      expect(dayIndex(next) - dayIndex(d)).toBe(1);
    }
  });
});

describe('countdown', () => {
  it('counts down to local midnight', () => {
    expect(msUntilNextDay(new Date(2026, 9, 3, 23, 0, 0))).toBe(3_600_000);
    expect(formatCountdown(3_600_000 + 61_000)).toBe('01:01:01');
    expect(formatCountdown(-5)).toBe('00:00:00');
  });
});

describe('answers', () => {
  it('uses every answer once in a fixed order', () => {
    const order = answerOrder();
    expect(order).toHaveLength(2309);
    expect(new Set(order).size).toBe(2309);
    expect(new Set(order)).toEqual(new Set(ANSWERS));
  });

  it('never repeats within 2,309 consecutive days', () => {
    const seen = new Set<string>();
    for (let day = 1932; day < 1932 + 2309; day++) seen.add(answerForDay(day));
    expect(seen.size).toBe(2309);
  });

  it('is stable for a given day', () => {
    expect(answerForDay(1932)).toBe(answerForDay(1932 + 2309));
  });

  it('only picks words that are valid guesses', () => {
    const valid = new Set(GUESSES);
    expect(GUESSES).toHaveLength(14855);
    expect(ANSWERS.every((w) => valid.has(w))).toBe(true);
  });
});
