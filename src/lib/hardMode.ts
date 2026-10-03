import { WORD_LENGTH, type LetterState } from './evaluate';

const ORDINALS = ['1st', '2nd', '3rd', '4th', '5th'];

/**
 * Hard mode: any revealed hints must be used in the next guess. Checks against the most recent
 * revealed row, greens (by position) before yellows (by count), and returns NYT's message or null.
 */
export function hardModeError(
  guess: string,
  previousGuess: string,
  previousEvaluation: LetterState[],
): string | null {
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (previousEvaluation[i] === 'correct' && guess[i] !== previousGuess[i]) {
      return `${ORDINALS[i]} letter must be ${previousGuess[i].toUpperCase()}`;
    }
  }

  const available = new Map<string, number>();
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (previousEvaluation[i] !== 'correct') {
      available.set(guess[i], (available.get(guess[i]) ?? 0) + 1);
    }
  }

  for (let i = 0; i < WORD_LENGTH; i++) {
    if (previousEvaluation[i] !== 'present') continue;
    const letter = previousGuess[i];
    const left = available.get(letter) ?? 0;
    if (left === 0) return `Guess must contain ${letter.toUpperCase()}`;
    available.set(letter, left - 1);
  }

  return null;
}
