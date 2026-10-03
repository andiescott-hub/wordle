export type LetterState = 'correct' | 'present' | 'absent';

export const WORD_LENGTH = 5;
export const MAX_GUESSES = 6;

/**
 * Scores a guess the way Wordle does: greens first, then yellows only while unmatched
 * copies of that letter remain in the answer, so duplicate letters are never over-reported.
 */
export function evaluateGuess(guess: string, answer: string): LetterState[] {
  const result: LetterState[] = Array(WORD_LENGTH).fill('absent');
  const remaining = new Map<string, number>();

  for (let i = 0; i < WORD_LENGTH; i++) {
    if (guess[i] === answer[i]) {
      result[i] = 'correct';
    } else {
      remaining.set(answer[i], (remaining.get(answer[i]) ?? 0) + 1);
    }
  }

  for (let i = 0; i < WORD_LENGTH; i++) {
    if (result[i] === 'correct') continue;
    const left = remaining.get(guess[i]) ?? 0;
    if (left > 0) {
      result[i] = 'present';
      remaining.set(guess[i], left - 1);
    }
  }

  return result;
}

const RANK: Record<LetterState, number> = { absent: 1, present: 2, correct: 3 };

/** Best state seen so far for each letter, used to colour the on-screen keyboard. */
export function keyboardStates(guesses: string[], answer: string): Record<string, LetterState> {
  const states: Record<string, LetterState> = {};
  for (const guess of guesses) {
    const evaluation = evaluateGuess(guess, answer);
    for (let i = 0; i < WORD_LENGTH; i++) {
      const letter = guess[i];
      const current = states[letter];
      if (!current || RANK[evaluation[i]] > RANK[current]) {
        states[letter] = evaluation[i];
      }
    }
  }
  return states;
}
