import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Board } from './components/Board';
import { Header } from './components/Header';
import { HelpModal } from './components/HelpModal';
import { Keyboard } from './components/Keyboard';
import { PostGame } from './components/PostGame';
import { SettingsModal } from './components/SettingsModal';
import { StatsPage } from './components/StatsPage';
import { Toasts, useToasts } from './components/Toasts';
import { answerForDay } from './lib/answer';
import { dayIndex, msUntilNextDay } from './lib/date';
import { MAX_GUESSES, WORD_LENGTH, evaluateGuess, keyboardStates } from './lib/evaluate';
import { hardModeError } from './lib/hardMode';
import { shareResults, shareText } from './lib/share';
import { EMPTY_STATS, displayedStreak, importStats, recordResult, type ImportInput, type Stats } from './lib/stats';
import { KEYS, load, save } from './lib/storage';

type Status = 'playing' | 'won' | 'lost';

interface GameState {
  day: number;
  guesses: string[];
  status: Status;
  /** True while every guess so far was made in hard mode (adds "*" when sharing). */
  hardMode: boolean;
}

interface Settings {
  hardMode: boolean;
  /** null follows the system setting until the player picks one. */
  darkTheme: boolean | null;
  highContrast: boolean;
  onscreenOnly: boolean;
}

type ModalName = 'help' | 'settings' | 'stats';

const DEFAULT_SETTINGS: Settings = { hardMode: false, darkTheme: null, highContrast: false, onscreenOnly: false };

const WIN_MESSAGES = ['Genius', 'Magnificent', 'Impressive', 'Splendid', 'Great', 'Phew'];

// Each tile flips for 500ms, starting 300ms after the one before it.
const REVEAL_MS = 300 * (WORD_LENGTH - 1) + 500;
const RESULTS_DELAY_MS = 2000;

let wordSet: Promise<Set<string>> | null = null;
function validWords(): Promise<Set<string>> {
  wordSet ??= import('./data/guesses').then((m) => new Set(m.default));
  return wordSet;
}

function loadGame(day: number, answer: string): GameState {
  const saved = load<Partial<GameState> | null>(KEYS.game, null);
  const guesses = saved?.day === day && Array.isArray(saved.guesses) ? saved.guesses : [];
  const valid = guesses.length <= MAX_GUESSES && guesses.every((g) => typeof g === 'string' && /^[a-z]{5}$/.test(g));
  if (!valid) return { day, guesses: [], status: 'playing', hardMode: false };
  const status: Status = guesses.includes(answer) ? 'won' : guesses.length === MAX_GUESSES ? 'lost' : 'playing';
  return { day, guesses, status, hardMode: saved?.hardMode === true };
}

function useSystemDark(): boolean {
  const [query] = useState(() =>
    typeof window.matchMedia === 'function' ? window.matchMedia('(prefers-color-scheme: dark)') : null,
  );
  const [dark, setDark] = useState(() => query?.matches ?? true);
  useEffect(() => {
    if (!query) return;
    const onChange = (e: MediaQueryListEvent) => setDark(e.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, [query]);
  return dark;
}

/** Tracks the puzzle day and swaps in a fresh game at local midnight. */
export default function App() {
  const [today, setToday] = useState(() => dayIndex());

  useEffect(() => {
    let timer = 0;
    const schedule = () => {
      clearTimeout(timer);
      timer = window.setTimeout(check, msUntilNextDay() + 250);
    };
    const check = () => {
      const now = dayIndex();
      if (now !== today) setToday(now);
      else schedule();
    };
    schedule();
    // Phones pause timers in the background, so also re-check when the app comes back.
    document.addEventListener('visibilitychange', check);
    window.addEventListener('focus', check);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', check);
      window.removeEventListener('focus', check);
    };
  }, [today]);

  return <Wordle key={today} day={today} />;
}

function Wordle({ day }: { day: number }) {
  const answer = useMemo(() => answerForDay(day), [day]);
  const [game, setGame] = useState(() => loadGame(day, answer));
  const [current, setCurrent] = useState('');
  const [stats, setStats] = useState<Stats>(() => ({ ...EMPTY_STATS, ...load<Partial<Stats>>(KEYS.stats, {}) }));
  const [settings, setSettings] = useState<Settings>(() => ({ ...DEFAULT_SETTINGS, ...load<Partial<Settings>>(KEYS.settings, {}) }));
  const [revealedRows, setRevealedRows] = useState(game.guesses.length);
  const [revealingRow, setRevealingRow] = useState<number | null>(null);
  const [bouncingRow, setBouncingRow] = useState<number | null>(null);
  const [shaking, setShaking] = useState(false);
  const [modal, setModal] = useState<ModalName | null>(null);
  const [showPostGame, setShowPostGame] = useState(game.status !== 'playing');
  const { toasts, showToast } = useToasts();
  const systemDark = useSystemDark();
  const darkTheme = settings.darkTheme ?? systemDark;

  const timers = useRef<number[]>([]);
  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  useEffect(() => save(KEYS.game, game), [game]);
  useEffect(() => save(KEYS.stats, stats), [stats]);
  useEffect(() => save(KEYS.settings, settings), [settings]);
  useEffect(() => void validWords(), []);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = darkTheme ? 'dark' : 'light';
    root.dataset.contrast = settings.highContrast ? 'high' : 'normal';
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', darkTheme ? '#121213' : '#ffffff');
  }, [darkTheme, settings.highContrast]);

  const keyStates = useMemo(
    () => keyboardStates(game.guesses.slice(0, revealedRows), answer),
    [game.guesses, revealedRows, answer],
  );

  const reject = (message: string) => {
    showToast(message);
    setShaking(true);
    later(() => setShaking(false), 600);
  };

  const submitting = useRef(false);
  async function submit() {
    if (submitting.current) return;
    const guess = current;
    if (guess.length < WORD_LENGTH) return reject('Not enough letters');

    submitting.current = true;
    const words = await validWords();
    submitting.current = false;
    if (!words.has(guess)) return reject('Not in word list');

    if (settings.hardMode && game.guesses.length > 0) {
      const previous = game.guesses[game.guesses.length - 1];
      const error = hardModeError(guess, previous, evaluateGuess(previous, answer));
      if (error) return reject(error);
    }

    const guesses = [...game.guesses, guess];
    const row = guesses.length - 1;
    const won = guess === answer;
    const status: Status = won ? 'won' : guesses.length === MAX_GUESSES ? 'lost' : 'playing';
    const hardMode = row === 0 ? settings.hardMode : game.hardMode && settings.hardMode;

    setGame({ day, guesses, status, hardMode });
    setCurrent('');
    setRevealingRow(row);
    // Count the result straight away so a reload mid-animation can't lose it.
    if (status !== 'playing') setStats((s) => recordResult(s, day, won, guesses.length));

    later(() => {
      setRevealingRow(null);
      setRevealedRows(guesses.length);
      if (status === 'playing') return;
      if (won) {
        setBouncingRow(row);
        showToast(WIN_MESSAGES[row], RESULTS_DELAY_MS);
      } else {
        showToast(answer.toUpperCase(), RESULTS_DELAY_MS + 1500);
      }
      later(() => {
        setShowPostGame(true);
        setModal('stats');
      }, RESULTS_DELAY_MS);
    }, REVEAL_MS);
  }

  function onKey(key: string) {
    if (modal || game.status !== 'playing' || revealingRow !== null) return;
    if (key === 'enter') {
      void submit();
    } else if (key === 'backspace') {
      setCurrent((c) => c.slice(0, -1));
    } else if (/^[a-z]$/.test(key)) {
      setCurrent((c) => (c.length < WORD_LENGTH ? c + key : c));
    }
  }

  // Physical keyboard, routed through the latest onKey so it always sees current state.
  const onKeyRef = useRef(onKey);
  onKeyRef.current = onKey;
  const modalRef = useRef(modal);
  modalRef.current = modal;
  useEffect(() => {
    if (settings.onscreenOnly) return;
    const handler = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || modalRef.current) return;
      const key = e.key.toLowerCase();
      if (key === 'enter' || key === 'backspace' || /^[a-z]$/.test(key)) {
        e.preventDefault();
        onKeyRef.current(key);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [settings.onscreenOnly]);

  function onHardMode(on: boolean) {
    if (on && game.status === 'playing' && game.guesses.length > 0) {
      showToast('Hard mode can only be enabled at the start of a round', 1500);
      return;
    }
    setSettings((s) => ({ ...s, hardMode: on }));
    if (!on && game.status === 'playing') setGame((g) => ({ ...g, hardMode: false }));
  }

  function onImport(input: ImportInput) {
    setStats(importStats(input, day));
    showToast('Stats imported', 1500);
  }

  async function onShare() {
    const text = shareText({
      puzzleNumber: day,
      evaluations: game.guesses.map((g) => evaluateGuess(g, answer)),
      won: game.status === 'won',
      hardMode: game.hardMode,
      darkTheme,
      highContrast: settings.highContrast,
    });
    const outcome = await shareResults(text);
    if (outcome === 'copied') showToast('Copied results to clipboard', 2000);
    if (outcome === 'failed') showToast('Could not share results', 2000);
  }

  const closeModal = useCallback(() => setModal(null), []);
  const streak = displayedStreak(stats, day);

  return (
    <div className="app">
      <Header onStats={() => setModal('stats')} onHelp={() => setModal('help')} onSettings={() => setModal('settings')} />
      <Toasts toasts={toasts} />
      <main className="game">
        <Board
          answer={answer}
          guesses={game.guesses}
          current={current}
          revealingRow={revealingRow}
          bouncingRow={bouncingRow}
          shaking={shaking}
        />
        {showPostGame ? (
          <PostGame onSeeResults={() => setModal('stats')} />
        ) : (
          <Keyboard states={keyStates} onKey={onKey} />
        )}
      </main>

      {modal === 'help' && <HelpModal onClose={closeModal} />}
      {modal === 'settings' && (
        <SettingsModal
          hardMode={settings.hardMode}
          darkTheme={darkTheme}
          highContrast={settings.highContrast}
          onscreenOnly={settings.onscreenOnly}
          onHardMode={onHardMode}
          onDarkTheme={(on) => setSettings((s) => ({ ...s, darkTheme: on }))}
          onHighContrast={(on) => setSettings((s) => ({ ...s, highContrast: on }))}
          onOnscreenOnly={(on) => setSettings((s) => ({ ...s, onscreenOnly: on }))}
          stats={stats}
          currentStreak={streak}
          onImport={onImport}
          onClose={closeModal}
        />
      )}
      {modal === 'stats' && (
        <StatsPage
          stats={stats}
          currentStreak={streak}
          status={game.status}
          guessCount={game.guesses.length}
          answer={answer}
          onShare={onShare}
          onClose={closeModal}
        />
      )}
    </div>
  );
}
