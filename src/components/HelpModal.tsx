import type { LetterState } from '../lib/evaluate';
import { Modal } from './Modal';

function Example({ word, highlight, state }: { word: string; highlight: number; state: LetterState }) {
  return (
    <div className="example-row" aria-hidden="true">
      {[...word].map((letter, i) => (
        <div key={i} className="tile small" data-state={i === highlight ? state : 'tbd'}>
          {letter}
        </div>
      ))}
    </div>
  );
}

export function HelpModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal label="How To Play" onClose={onClose}>
      <section className="help">
        <h2 className="modal-heading">How To Play</h2>
        <h3 className="help-subtitle">Guess the Wordle in 6 tries.</h3>
        <ul>
          <li>Each guess must be a valid 5-letter word.</li>
          <li>The color of the tiles will change to show how close your guess was to the word.</li>
        </ul>
        <p className="help-examples-title">Examples</p>
        <Example word="wordy" highlight={0} state="correct" />
        <p>
          <strong>W</strong> is in the word and in the correct spot.
        </p>
        <Example word="light" highlight={1} state="present" />
        <p>
          <strong>I</strong> is in the word but in the wrong spot.
        </p>
        <Example word="rogue" highlight={3} state="absent" />
        <p>
          <strong>U</strong> is not in the word in any spot.
        </p>
        <p className="help-footer">A new puzzle is released daily at midnight.</p>
      </section>
    </Modal>
  );
}
