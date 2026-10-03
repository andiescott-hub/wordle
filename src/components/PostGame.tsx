import { Countdown } from './Countdown';

/** Shown in place of the keyboard once today's game is over. */
export function PostGame({ onSeeResults }: { onSeeResults: () => void }) {
  return (
    <div className="post-game">
      <button type="button" className="outline-button" onClick={onSeeResults}>
        See results
      </button>
      <p className="post-game-next">
        Next Wordle in <Countdown />
      </p>
    </div>
  );
}
