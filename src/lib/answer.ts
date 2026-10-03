import ANSWERS from '../data/answers';

// Fixed seed so every device picks the same word on the same day.
const SEED = 0x57_6f_72_64; // "Word"

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let ordered: string[] | null = null;

/** The answer list in its fixed daily order (a seeded Fisher-Yates shuffle). */
export function answerOrder(): string[] {
  if (ordered) return ordered;
  const list = [...ANSWERS];
  const random = mulberry32(SEED);
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  ordered = list;
  return list;
}

/** The answer for a puzzle day. No word repeats within any run of 2,309 consecutive days. */
export function answerForDay(day: number): string {
  const list = answerOrder();
  const n = list.length;
  return list[((day % n) + n) % n];
}
