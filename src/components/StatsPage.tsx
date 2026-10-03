import { MAX_GUESSES } from '../lib/evaluate';
import { winPercent, type Stats } from '../lib/stats';
import { Countdown } from './Countdown';
import { ShareIcon, StarBadge } from './icons';
import { Modal } from './Modal';

interface Props {
  stats: Stats;
  currentStreak: number;
  status: 'playing' | 'won' | 'lost';
  guessCount: number;
  answer: string;
  onShare: () => void;
  onClose: () => void;
}

export function StatsPage({ stats, currentStreak, status, guessCount, answer, onShare, onClose }: Props) {
  const finished = status !== 'playing';
  const maxCount = Math.max(1, ...stats.distribution);

  return (
    <Modal label="Statistics" onClose={onClose} closeText="Back to puzzle">
      <section className="stats">
        {finished && (
          <div className="stats-badge">
            <StarBadge won={status === 'won'} />
          </div>
        )}
        {status === 'won' && <h2 className="stats-heading">Congratulations!</h2>}
        {status === 'lost' && (
          <>
            <h2 className="stats-heading">Thanks for playing today!</h2>
            <p className="stats-answer">
              The word was <strong>{answer.toUpperCase()}</strong>
            </p>
          </>
        )}

        <h3 className="stats-title">Statistics</h3>
        <div className="stats-row">
          <Stat value={stats.played} label="Played" />
          <Stat value={winPercent(stats)} label="Win %" />
          <Stat value={currentStreak} label="Current Streak" />
          <Stat value={stats.maxStreak} label="Max Streak" />
        </div>

        <h3 className="stats-title">Guess Distribution</h3>
        {stats.played === 0 ? (
          <p className="stats-empty">No Data</p>
        ) : (
          <div className="distribution">
            {Array.from({ length: MAX_GUESSES }, (_, i) => {
              const count = stats.distribution[i];
              const highlight = status === 'won' && guessCount === i + 1;
              return (
                <div className="distribution-row" key={i}>
                  <span className="distribution-label">{i + 1}</span>
                  <div className="distribution-track">
                    <div
                      className={`distribution-bar${highlight ? ' highlight' : ''}`}
                      style={{ width: `${Math.max(7, Math.round((count / maxCount) * 100))}%` }}
                    >
                      {count}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {finished && (
          <>
            <button type="button" className="share-button" onClick={onShare}>
              Share <ShareIcon />
            </button>
            <div className="countdown">
              <div className="countdown-label">Next Wordle</div>
              <Countdown />
            </div>
          </>
        )}
      </section>
    </Modal>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="stat">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}
