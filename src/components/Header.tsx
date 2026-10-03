import { HelpIcon, SettingsIcon, StatsIcon } from './icons';

interface Props {
  onStats: () => void;
  onHelp: () => void;
  onSettings: () => void;
}

export function Header({ onStats, onHelp, onSettings }: Props) {
  return (
    <header className="header">
      <h1 className="wordmark">Wordle</h1>
      <nav className="header-icons">
        <button type="button" className="icon-button" aria-label="Statistics" onClick={onStats}>
          <StatsIcon />
        </button>
        <button type="button" className="icon-button" aria-label="Help" onClick={onHelp}>
          <HelpIcon />
        </button>
        <button type="button" className="icon-button" aria-label="Settings" onClick={onSettings}>
          <SettingsIcon />
        </button>
      </nav>
    </header>
  );
}
