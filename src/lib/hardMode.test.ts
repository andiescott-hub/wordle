import { describe, expect, it } from 'vitest';
import { evaluateGuess } from './evaluate';
import { hardModeError } from './hardMode';

function check(guess: string, previous: string, answer: string) {
  return hardModeError(guess, previous, evaluateGuess(previous, answer));
}

describe('hardModeError', () => {
  it('requires greens in place, with NYT wording', () => {
    expect(check('salty', 'broke', 'peeve')).toBe('5th letter must be E');
    expect(check('tours', 'pleat', 'prize')).toBe('1st letter must be P');
    expect(check('pours', 'pleat', 'prize')).toBe('Guess must contain E');
  });

  it('requires yellows to be used somewhere', () => {
    expect(check('broil', 'salet', 'peeve')).toBe('Guess must contain E');
    expect(check('broke', 'salet', 'peeve')).toBeNull();
  });

  it('checks greens before yellows', () => {
    // CRATE vs TRACE: R and A green, C, T, E yellow.
    expect(check('bloke', 'crate', 'trace')).toBe('2nd letter must be R');
  });

  it('counts repeated yellows', () => {
    // ERASE vs GEESE: E(0) present, E(4) correct, S(3) correct.
    const evaluation = evaluateGuess('erase', 'geese');
    expect(evaluation).toEqual(['present', 'absent', 'absent', 'correct', 'correct']);
    expect(hardModeError('those', 'erase', evaluation)).toBe('Guess must contain E');
    expect(hardModeError('geese', 'erase', evaluation)).toBeNull();
  });

  it('allows anything after a row with no hints', () => {
    expect(check('mound', 'salty', 'peeve')).toBeNull();
  });
});
