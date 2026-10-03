import { describe, expect, it } from 'vitest';
import { evaluateGuess, keyboardStates } from './evaluate';

describe('evaluateGuess', () => {
  // The game from the user's screenshots: answer PEEVE.
  it('matches the screenshot rows for PEEVE', () => {
    expect(evaluateGuess('salet', 'peeve')).toEqual(['absent', 'absent', 'absent', 'present', 'absent']);
    expect(evaluateGuess('broke', 'peeve')).toEqual(['absent', 'absent', 'absent', 'absent', 'correct']);
    expect(evaluateGuess('chime', 'peeve')).toEqual(['absent', 'absent', 'absent', 'absent', 'correct']);
    expect(evaluateGuess('nudge', 'peeve')).toEqual(['absent', 'absent', 'absent', 'absent', 'correct']);
    expect(evaluateGuess('peeve', 'peeve')).toEqual(Array(5).fill('correct'));
  });

  it('does not over-report duplicate letters', () => {
    // Only one L in the answer, already matched in place.
    expect(evaluateGuess('llama', 'label')).toEqual(['correct', 'present', 'present', 'absent', 'absent']);
    expect(evaluateGuess('hello', 'world')).toEqual(['absent', 'absent', 'absent', 'correct', 'present']);
    // Green takes priority over an earlier yellow for the same letter.
    expect(evaluateGuess('speed', 'abide')).toEqual(['absent', 'absent', 'present', 'absent', 'present']);
    expect(evaluateGuess('eerie', 'there')).toEqual(['present', 'absent', 'present', 'absent', 'correct']);
  });
});

describe('keyboardStates', () => {
  it('keeps the best state per letter, as in the screenshot keyboard', () => {
    const states = keyboardStates(['salet', 'broke'], 'peeve');
    expect(states.e).toBe('correct');
    expect(states.s).toBe('absent');
    expect(states.k).toBe('absent');
    expect(states.p).toBeUndefined();
  });
});
