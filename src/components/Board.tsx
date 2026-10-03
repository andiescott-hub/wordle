import type { CSSProperties } from 'react';
import { MAX_GUESSES, WORD_LENGTH, evaluateGuess, type LetterState } from '../lib/evaluate';

type TileState = LetterState | 'empty' | 'tbd';

interface Props {
  answer: string;
  guesses: string[];
  current: string;
  /** Row currently flipping over to reveal its colours. */
  revealingRow: number | null;
  /** Winning row, which bounces once revealed. */
  bouncingRow: number | null;
  shaking: boolean;
}

export function Board({ answer, guesses, current, revealingRow, bouncingRow, shaking }: Props) {
  const rows = [];
  for (let r = 0; r < MAX_GUESSES; r++) {
    if (r < guesses.length) {
      const evaluation = evaluateGuess(guesses[r], answer);
      const anim = r === revealingRow ? 'reveal' : r === bouncingRow ? 'bounce' : undefined;
      rows.push(<Row key={r} index={r} letters={guesses[r]} states={evaluation} anim={anim} />);
    } else if (r === guesses.length) {
      rows.push(<Row key={r} index={r} letters={current} shaking={shaking} />);
    } else {
      rows.push(<Row key={r} index={r} letters="" />);
    }
  }
  return (
    <div className="board-container">
      <div className="board">{rows}</div>
    </div>
  );
}

interface RowProps {
  index: number;
  letters: string;
  states?: LetterState[];
  anim?: 'reveal' | 'bounce';
  shaking?: boolean;
}

function Row({ index, letters, states, anim, shaking }: RowProps) {
  return (
    <div className={`row${shaking ? ' shake' : ''}`} role="group" aria-label={`Row ${index + 1}`}>
      {Array.from({ length: WORD_LENGTH }, (_, i) => {
        const letter = letters[i] ?? '';
        const state: TileState = states ? states[i] : letter ? 'tbd' : 'empty';
        return <Tile key={i} letter={letter} state={state} position={i} anim={anim} />;
      })}
    </div>
  );
}

const ORDINALS = ['1st', '2nd', '3rd', '4th', '5th'];

const STATE_LABEL: Record<TileState, string> = {
  empty: 'empty',
  tbd: '',
  correct: 'correct',
  present: 'present in another position',
  absent: 'absent',
};

interface TileProps {
  letter: string;
  state: TileState;
  position: number;
  anim?: 'reveal' | 'bounce';
}

function Tile({ letter, state, position, anim }: TileProps) {
  const detail = STATE_LABEL[state] ? `, ${STATE_LABEL[state]}` : '';
  const label = letter ? `${ORDINALS[position]} letter, ${letter.toUpperCase()}${detail}` : 'empty';
  return (
    <div
      className={`tile${anim ? ` ${anim}` : ''}`}
      data-state={state}
      style={{ '--i': position } as CSSProperties}
      aria-label={label}
      aria-roledescription="tile"
      role="img"
    >
      {letter}
    </div>
  );
}
