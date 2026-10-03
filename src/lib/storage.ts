// localStorage can be unavailable (private mode, blocked site data), so every access is guarded.

export function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

export function save(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore: the game still works, it just won't persist.
  }
}

export const KEYS = {
  game: 'wordle:game',
  stats: 'wordle:stats',
  settings: 'wordle:settings',
} as const;
