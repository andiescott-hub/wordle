import { describe, expect, it } from 'vitest';
import { evaluateGuess } from './evaluate';
import { shareText } from './share';

const rows = ['salet', 'broke', 'chime', 'nudge', 'peeve'].map((g) => evaluateGuess(g, 'peeve'));

describe('shareText', () => {
  it('matches the NYT format', () => {
    const text = shareText({ puzzleNumber: 1932, evaluations: rows, won: true, hardMode: false, darkTheme: true, highContrast: false });
    expect(text).toBe('Wordle 1,932 5/6\n\n⬛⬛⬛🟨⬛\n⬛⬛⬛⬛🟩\n⬛⬛⬛⬛🟩\n⬛⬛⬛⬛🟩\n🟩🟩🟩🟩🟩');
  });

  it('marks hard mode, losses, light theme and high contrast', () => {
    const text = shareText({ puzzleNumber: 7, evaluations: rows.slice(0, 2), won: false, hardMode: true, darkTheme: false, highContrast: true });
    expect(text).toBe('Wordle 7 X/6*\n\n⬜⬜⬜🟦⬜\n⬜⬜⬜⬜🟧');
  });
});
