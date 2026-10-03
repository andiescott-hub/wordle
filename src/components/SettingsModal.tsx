import { useState } from 'react';
import type { ImportInput, Stats } from '../lib/stats';
import { ImportStatsForm } from './ImportStatsForm';
import { Modal } from './Modal';

interface Props {
  hardMode: boolean;
  darkTheme: boolean;
  highContrast: boolean;
  onscreenOnly: boolean;
  onHardMode: (on: boolean) => void;
  onDarkTheme: (on: boolean) => void;
  onHighContrast: (on: boolean) => void;
  onOnscreenOnly: (on: boolean) => void;
  stats: Stats;
  currentStreak: number;
  onImport: (input: ImportInput) => void;
  onClose: () => void;
}

export function SettingsModal(p: Props) {
  const [importing, setImporting] = useState(false);

  return (
    <Modal label="Settings" onClose={p.onClose}>
      <section className="settings">
        <h2 className="modal-heading">Settings</h2>
        <Setting
          title="Hard Mode"
          description="Any revealed hints must be used in subsequent guesses"
          checked={p.hardMode}
          onChange={p.onHardMode}
        />
        <Setting title="Dark Theme" checked={p.darkTheme} onChange={p.onDarkTheme} />
        <Setting
          title="High Contrast Mode"
          description="Contrast and colorblindness improvements"
          checked={p.highContrast}
          onChange={p.onHighContrast}
        />
        <Setting
          title="Onscreen Keyboard Input Only"
          description="Ignore key input except from the onscreen keyboard. Most helpful for users using speech recognition or other assistive devices."
          checked={p.onscreenOnly}
          onChange={p.onOnscreenOnly}
        />
        <div className="setting">
          <div className="setting-text">
            <div className="setting-title">Import Stats</div>
            <div className="setting-description">Carry over your numbers from NYT Wordle</div>
          </div>
          {!importing && (
            <button type="button" className="outline-button small" onClick={() => setImporting(true)}>
              Import
            </button>
          )}
        </div>
        {importing && (
          <ImportStatsForm
            stats={p.stats}
            currentStreak={p.currentStreak}
            onCancel={() => setImporting(false)}
            onImport={(input) => {
              p.onImport(input);
              setImporting(false);
            }}
          />
        )}
      </section>
    </Modal>
  );
}

interface SettingProps {
  title: string;
  description?: string;
  checked: boolean;
  onChange: (on: boolean) => void;
}

function Setting({ title, description, checked, onChange }: SettingProps) {
  return (
    <div className="setting">
      <div className="setting-text">
        <div className="setting-title">{title}</div>
        {description && <div className="setting-description">{description}</div>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={title}
        className="switch"
        onClick={() => onChange(!checked)}
      >
        <span className="knob" />
      </button>
    </div>
  );
}
