import type { MouseEvent } from 'react';
import type { LetterState } from '../lib/evaluate';
import { BackspaceIcon } from './icons';

const ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];

interface Props {
  states: Record<string, LetterState>;
  onKey: (key: string) => void;
}

export function Keyboard({ states, onKey }: Props) {
  // Drop focus after a tap so a physical Enter press can't re-trigger the last key.
  const press = (key: string) => (e: MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.blur();
    onKey(key);
  };

  return (
    <div className="keyboard" role="group" aria-label="Keyboard">
      {ROWS.map((row, r) => (
        <div className="keyboard-row" key={row}>
          {r === 1 && <div className="key-spacer" />}
          {r === 2 && (
            <button type="button" className="key wide" onClick={press('enter')}>
              enter
            </button>
          )}
          {[...row].map((letter) => (
            <button
              type="button"
              key={letter}
              className="key"
              data-key={letter}
              data-state={states[letter]}
              aria-label={`add ${letter}${states[letter] ? `, ${states[letter]}` : ''}`}
              onClick={press(letter)}
            >
              {letter}
            </button>
          ))}
          {r === 1 && <div className="key-spacer" />}
          {r === 2 && (
            <button type="button" className="key wide" aria-label="backspace" onClick={press('backspace')}>
              <BackspaceIcon />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
