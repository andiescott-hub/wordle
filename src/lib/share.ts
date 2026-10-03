import type { LetterState } from './evaluate';

interface ShareOptions {
  puzzleNumber: number;
  evaluations: LetterState[][];
  won: boolean;
  hardMode: boolean;
  darkTheme: boolean;
  highContrast: boolean;
}

/** NYT's share format, e.g. "Wordle 1,932 5/6*" followed by the emoji grid. */
export function shareText(o: ShareOptions): string {
  const score = o.won ? String(o.evaluations.length) : 'X';
  const header = `Wordle ${o.puzzleNumber.toLocaleString('en-US')} ${score}/6${o.hardMode ? '*' : ''}`;
  const emoji: Record<LetterState, string> = {
    correct: o.highContrast ? '🟧' : '🟩',
    present: o.highContrast ? '🟦' : '🟨',
    absent: o.darkTheme ? '⬛' : '⬜',
  };
  const rows = o.evaluations.map((row) => row.map((s) => emoji[s]).join(''));
  return `${header}\n\n${rows.join('\n')}`;
}

function isMobile(): boolean {
  const ua = navigator.userAgent;
  return /Android|iPhone|iPad|iPod/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}

export type ShareOutcome = 'shared' | 'copied' | 'cancelled' | 'failed';

/** Uses the native share sheet on phones and the clipboard elsewhere, like NYT. */
export async function shareResults(text: string): Promise<ShareOutcome> {
  if (isMobile() && typeof navigator.share === 'function') {
    try {
      await navigator.share({ text });
      return 'shared';
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled';
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    return 'copied';
  } catch {
    return 'failed';
  }
}
