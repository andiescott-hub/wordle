# Wordle

A faithful replica of the NYT Wordle game that opens straight onto the board. It has no menus,
subscribe prompts, ads, promos or archive. Same rules, same stats, one puzzle a day.

## What's included

- **NYT rules**: 6 guesses, 5-letter words, and the same green / yellow / grey scoring,
  including how repeated letters are handled. Toasts read "Not enough letters", "Not in word
  list" and "Genius" through "Phew".
- **NYT word data**: the 2,309-word NYT answer list and the 14,855-word NYT valid-guess list.
  Each day's answer comes from a fixed, shuffled order of the answer list, so every device gets
  the same word, and no word repeats for about 6 years. Puzzle numbers follow NYT's numbering
  (days since 19 June 2021).
- **One play a day**: a finished game stays locked until local midnight, then the next puzzle
  loads automatically.
- **Statistics**: Played, Win %, Current Streak, Max Streak, guess distribution, a countdown
  to the next puzzle, and NYT-style emoji sharing.
- **Settings**: Hard Mode, Dark Theme, High Contrast Mode, Onscreen Keyboard Input Only, and
  **Import Stats**.
- Can be installed on the iPhone home screen, where it opens full screen like an app.

## Deploy to Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and sign in with GitHub.
2. Import the `andiescott-hub/wordle` repository.
3. Leave the settings as detected (Framework: **Vite**, Build: `npm run build`, Output: `dist`)
   and click **Deploy**.

Every push to the repository's default branch redeploys automatically. There is no backend
and nothing to configure.

## Put it on your iPhone home screen

Open the Vercel URL in Safari, tap **Share**, then **Add to Home Screen**. It then opens
full screen, like an app, with no Safari bars.

On iOS, the home-screen app and Safari keep **separate** saved data. Pick one way to play,
and import your stats there.

## Carry over your NYT stats

Settings → **Import Stats** → **Import**. Copy in Played, Current streak, Max streak, and your
wins for 1 to 6 guesses from the NYT statistics screen.

- Leave **"These numbers include today's game"** ticked if you've already played today on NYT.
  Today won't be counted twice, and your streak carries on tomorrow.
- Untick it if you haven't, so that playing today in this app extends your streak.

Stats are stored in the browser on each device.

## Development

```bash
npm install
npm run dev         # local dev server
npm test            # unit tests (Vitest)
npm run test:e2e    # end-to-end tests (Playwright, Chromium)
npm run build       # typecheck + production build
```

Word lists live in `src/data/`. The answers come from
[3b1b/videos](https://github.com/3b1b/videos/blob/master/_2022/wordle/data/possible_words.txt)
and the guesses from [tabatkins/wordle-list](https://github.com/tabatkins/wordle-list).
The app icons are generated with `npx tsx scripts/make-icons.ts`.
