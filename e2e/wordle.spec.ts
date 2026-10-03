import { expect, test, type Page } from '@playwright/test';
import { answerForDay } from '../src/lib/answer';
import { dayIndex } from '../src/lib/date';
import { evaluateGuess } from '../src/lib/evaluate';
import { hardModeError } from '../src/lib/hardMode';
import GUESSES from '../src/data/guesses';

const SHOTS = process.env.SCREENSHOT_DIR ?? 'test-results/screens';

// 3 Oct 2026, 11:00 in Melbourne, the time of the user's screenshots.
const START = new Date('2026-10-03T11:00:00+10:00');
const DAY = 1932;
const ANSWER = answerForDay(DAY);

test.use({ timezoneId: 'Australia/Melbourne' });

test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: START });
});

/** Valid guesses that aren't today's answer, for filling rows. */
function wrongGuesses(count: number, answer = ANSWER): string[] {
  return ['salet', 'broke', 'chimp', 'nudge', 'fjord', 'gawky', 'pious', 'lymph'].filter((w) => w !== answer).slice(0, count);
}

const row = (page: Page, n: number) => page.getByRole('group', { name: `Row ${n}` }).locator('.tile');

/** Opens the app and waits until it is listening for key presses. */
async function open(page: Page) {
  await page.goto('/');
  await expect(page.locator('.board')).toBeVisible();
  await page.waitForTimeout(200);
}

async function guess(page: Page, word: string) {
  await page.keyboard.type(word);
  await page.keyboard.press('Enter');
}

async function expectRow(page: Page, n: number, word: string, answer = ANSWER) {
  const states = evaluateGuess(word, answer);
  const tiles = row(page, n);
  for (let i = 0; i < 5; i++) {
    await expect(tiles.nth(i)).toHaveText(word[i]);
    await expect(tiles.nth(i)).toHaveAttribute('data-state', states[i]);
  }
  // Input is ignored while the tiles flip, as in NYT, so wait for the reveal to finish.
  await expect(page.locator('.tile.reveal')).toHaveCount(0);
}

test('loads straight into today\'s game and plays it to a win', async ({ page }) => {
  expect(dayIndex(START)).toBe(DAY);
  await open(page);

  // No landing page or help popup: the board and keyboard are ready.
  await expect(row(page, 1)).toHaveCount(5);
  await expect(page.getByRole('group', { name: 'Keyboard' })).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);

  await guess(page, 'abc');
  await expect(page.getByText('Not enough letters')).toBeVisible();
  await page.keyboard.type('de');
  await page.keyboard.press('Enter');
  await expect(page.getByText('Not in word list')).toBeVisible();
  for (let i = 0; i < 5; i++) await page.keyboard.press('Backspace');
  await expect(row(page, 1).first()).toHaveAttribute('data-state', 'empty');

  const [first, second] = wrongGuesses(2);
  await guess(page, first);
  await expectRow(page, 1, first);
  await page.screenshot({ path: `${SHOTS}/01-first-guess.png` });

  // Second guess typed on the on-screen keyboard.
  for (const letter of second) await page.locator(`.key[data-key="${letter}"]`).click();
  await page.getByRole('button', { name: 'enter' }).click();
  await expectRow(page, 2, second);

  // Keyboard keys pick up colours once a row is revealed.
  const firstStates = evaluateGuess(first, ANSWER);
  await expect(page.locator(`.key[data-key="${first[0]}"]`)).toHaveAttribute('data-state', /correct|present|absent/);
  expect(firstStates).toHaveLength(5);

  await guess(page, ANSWER);
  await expectRow(page, 3, ANSWER);
  await expect(page.locator('.toast', { hasText: 'Impressive' })).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/02-win-toast.png` });

  // Results open on their own.
  const stats = page.getByRole('dialog', { name: 'Statistics' });
  await expect(stats.getByText('Congratulations!')).toBeVisible({ timeout: 6000 });
  await expect(stats.locator('.stat-value')).toHaveText(['1', '100', '1', '1']);
  await expect(stats.locator('.distribution-bar.highlight')).toHaveText('1');
  await expect(stats.locator('.countdown-time')).toHaveText(/^\d\d:\d\d:\d\d$/);
  await page.screenshot({ path: `${SHOTS}/03-stats.png` });

  await stats.getByRole('button', { name: 'Back to puzzle' }).click();
  await expect(page.getByRole('button', { name: 'See results' })).toBeVisible();
  await expect(page.getByRole('group', { name: 'Keyboard' })).toHaveCount(0);
  await page.screenshot({ path: `${SHOTS}/04-post-game.png` });

  // One play a day: a reload keeps the finished board locked.
  await page.reload();
  await expectRow(page, 3, ANSWER);
  await expect(page.getByRole('button', { name: 'See results' })).toBeVisible();
  await page.keyboard.type('hello');
  await expect(row(page, 4).first()).toHaveAttribute('data-state', 'empty');
});

test('a new puzzle arrives at midnight and the streak carries on', async ({ page }) => {
  await open(page);
  await guess(page, ANSWER);
  await expect(page.getByRole('dialog', { name: 'Statistics' })).toBeVisible({ timeout: 6000 });
  await page.getByRole('button', { name: 'Back to puzzle' }).click();

  // Jump to 00:00:05 the next day; the midnight timer swaps in the new game.
  await page.clock.fastForward('13:00:05');
  await expect(page.getByRole('group', { name: 'Keyboard' })).toBeVisible();
  await expect(row(page, 1).first()).toHaveAttribute('data-state', 'empty');

  const tomorrow = answerForDay(DAY + 1);
  expect(tomorrow).not.toBe(ANSWER);
  await guess(page, tomorrow);
  await expect(page.locator('.toast', { hasText: 'Genius' })).toBeVisible();
  const stats = page.getByRole('dialog', { name: 'Statistics' });
  await expect(stats.locator('.stat-value')).toHaveText(['2', '100', '2', '2'], { timeout: 6000 });
});

test('a loss shows the answer and resets the streak', async ({ page }) => {
  await open(page);
  const words = wrongGuesses(6);
  for (let i = 0; i < 6; i++) {
    await guess(page, words[i]);
    await expectRow(page, i + 1, words[i]);
  }
  await expect(page.locator('.toast', { hasText: ANSWER.toUpperCase() })).toBeVisible();
  const stats = page.getByRole('dialog', { name: 'Statistics' });
  await expect(stats.getByText('Thanks for playing today!')).toBeVisible({ timeout: 6000 });
  await expect(stats.locator('.stat-value')).toHaveText(['1', '0', '0', '0']);
  await expect(stats.locator('.distribution-bar.highlight')).toHaveCount(0);
});

test('hard mode enforces revealed hints', async ({ page }) => {
  await open(page);

  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('switch', { name: 'Hard Mode' }).click();
  await expect(page.getByRole('switch', { name: 'Hard Mode' })).toHaveAttribute('aria-checked', 'true');
  await page.getByRole('button', { name: 'Close' }).click();

  // Find a first guess that reveals a hint and a second guess that ignores it.
  const first = GUESSES.find((w) => w !== ANSWER && evaluateGuess(w, ANSWER).some((s) => s !== 'absent'))!;
  const firstEval = evaluateGuess(first, ANSWER);
  const breaking = GUESSES.find((w) => w !== ANSWER && hardModeError(w, first, firstEval) !== null)!;
  const message = hardModeError(breaking, first, firstEval)!;

  await guess(page, first);
  await expectRow(page, 1, first);
  await guess(page, breaking);
  await expect(page.locator('.toast', { hasText: message })).toBeVisible();
  await expect(row(page, 2).first()).toHaveAttribute('data-state', 'tbd');

  // Hard mode can't be switched back on mid-game once it is turned off.
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('switch', { name: 'Hard Mode' }).click();
  await expect(page.getByRole('switch', { name: 'Hard Mode' })).toHaveAttribute('aria-checked', 'false');
  await page.getByRole('switch', { name: 'Hard Mode' }).click();
  await expect(page.getByText('Hard mode can only be enabled at the start of a round')).toBeVisible();
  await expect(page.getByRole('switch', { name: 'Hard Mode' })).toHaveAttribute('aria-checked', 'false');
});

test('imported NYT stats carry over without double counting today', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('button', { name: 'Import' }).click();

  const form = page.locator('.import-form');
  await form.getByLabel('Played').fill('1638');
  await form.getByLabel('Current streak').fill('13');
  await form.getByLabel('Max streak').fill('98');
  const wins = ['1', '89', '465', '622', '311', '114'];
  for (let i = 0; i < 6; i++) await form.getByLabel(`Wins in ${i + 1}`).fill(wins[i]);
  await expect(form.getByLabel(/include today's game/)).toBeChecked();
  await page.screenshot({ path: `${SHOTS}/05-import.png` });
  await form.getByRole('button', { name: 'Import' }).click();
  await expect(page.getByText('Stats imported')).toBeVisible();
  await page.getByRole('button', { name: 'Close' }).click();

  await page.getByRole('button', { name: 'Statistics' }).click();
  const stats = page.getByRole('dialog', { name: 'Statistics' });
  await expect(stats.locator('.stat-value')).toHaveText(['1638', '98', '13', '98']);
  await expect(stats.locator('.distribution-bar')).toHaveText(wins);
  await stats.getByRole('button', { name: 'Back to puzzle' }).click();

  // Today was already counted in the imported numbers, so winning here changes nothing.
  await guess(page, ANSWER);
  await expect(stats.getByText('Congratulations!')).toBeVisible({ timeout: 6000 });
  await expect(stats.locator('.stat-value')).toHaveText(['1638', '98', '13', '98']);

  // Rejects impossible numbers.
  await stats.getByRole('button', { name: 'Back to puzzle' }).click();
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('button', { name: 'Import' }).click();
  await form.getByLabel('Played').fill('10');
  await form.getByRole('button', { name: 'Import' }).click();
  await expect(form.getByRole('alert')).toHaveText(/cannot be more than Played/);
});

test('settings switch theme and contrast', async ({ page }) => {
  await open(page);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('switch', { name: 'Dark Theme' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.getByRole('switch', { name: 'High Contrast Mode' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-contrast', 'high');
  await page.screenshot({ path: `${SHOTS}/06-settings-light.png` });

  // Saved across reloads, with no dark flash first.
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

  await page.getByRole('button', { name: 'Help' }).click();
  await expect(page.getByRole('dialog', { name: 'How To Play' })).toContainText('Guess the Wordle in 6 tries.');
});
