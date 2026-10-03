import { useState, type FormEvent } from 'react';
import { MAX_GUESSES } from '../lib/evaluate';
import { validateImport, type ImportInput, type Stats } from '../lib/stats';

interface Props {
  stats: Stats;
  currentStreak: number;
  onImport: (input: ImportInput) => void;
  onCancel: () => void;
}

type Field = 'played' | 'currentStreak' | 'maxStreak';

const FIELDS: { key: Field; label: string }[] = [
  { key: 'played', label: 'Played' },
  { key: 'currentStreak', label: 'Current streak' },
  { key: 'maxStreak', label: 'Max streak' },
];

export function ImportStatsForm({ stats, currentStreak, onImport, onCancel }: Props) {
  const [values, setValues] = useState<Record<Field, string>>({
    played: String(stats.played),
    currentStreak: String(currentStreak),
    maxStreak: String(stats.maxStreak),
  });
  const [distribution, setDistribution] = useState(stats.distribution.map(String));
  const [includesToday, setIncludesToday] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const toNumber = (v: string) => (v.trim() === '' ? 0 : Number(v));

  function submit(e: FormEvent) {
    e.preventDefault();
    const input: ImportInput = {
      played: toNumber(values.played),
      currentStreak: toNumber(values.currentStreak),
      maxStreak: toNumber(values.maxStreak),
      distribution: distribution.map(toNumber),
      includesToday,
    };
    const problem = validateImport(input);
    setError(problem);
    if (problem) return;
    if (stats.played > 0 && !window.confirm('Replace the stats saved on this device?')) return;
    onImport(input);
  }

  return (
    <form className="import-form" onSubmit={submit} noValidate>
      <p className="import-help">
        Copy the numbers from your NYT Wordle statistics. Stats are saved on this device only.
      </p>
      <div className="import-grid">
        {FIELDS.map(({ key, label }) => (
          <label key={key}>
            <span>{label}</span>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              value={values[key]}
              onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
            />
          </label>
        ))}
      </div>
      <p className="import-subtitle">Wins by number of guesses</p>
      <div className="import-grid six">
        {Array.from({ length: MAX_GUESSES }, (_, i) => (
          <label key={i}>
            <span>{i + 1}</span>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              aria-label={`Wins in ${i + 1}`}
              value={distribution[i]}
              onChange={(e) => setDistribution((d) => d.map((x, j) => (j === i ? e.target.value : x)))}
            />
          </label>
        ))}
      </div>
      <label className="import-checkbox">
        <input type="checkbox" checked={includesToday} onChange={(e) => setIncludesToday(e.target.checked)} />
        <span>
          These numbers include today's game
          <small>If ticked, today's game in this app won't be counted again. Your streak carries on tomorrow.</small>
        </span>
      </label>
      {error && (
        <p className="import-error" role="alert">
          {error}
        </p>
      )}
      <div className="import-actions">
        <button type="button" className="outline-button small" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="solid-button small">
          Import
        </button>
      </div>
    </form>
  );
}
