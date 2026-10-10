# Flags Game

A flag guessing game with two ways to play: type the country name or pick from four answers. Multiple-choice answers are shuffled for every flag. Territories with the same flag as another country are excluded so every question has one clear answer. On desktop, use number keys 1–4; when typing, press Enter or select **Check answer**.

Country names use familiar forms such as Syria, Russia, South Korea, and the United Kingdom. Typed answers ignore capitalization, spacing, punctuation, and accents, and accept common alternatives such as UK, USA, and Czech Republic.

Each mode tracks its own current streak, best streak, and total correct answers. A wrong answer resets the current streak. Progress and your light/dark theme are saved in this browser’s local storage; the original `HiScore` is preserved as the typed mode’s best streak. Clearing browser data removes saved progress. If storage is blocked, the game still works for the current visit.

The centered layout adapts to phones, tablets, desktop screens, and landscape orientations. Dark mode uses `#161616`. Flag images require access to [FlagCDN](https://flagcdn.com/).

## Run locally

```sh
npm ci
npm run dev
```

## Build and test

```sh
npm run build
npm test
```

Tests cover answer matching, randomized choices, streak persistence, unavailable storage, theme persistence, and layouts from 320px to 1920px wide. They use the system Chromium when available. Otherwise, install Playwright’s browser:

```sh
npx playwright install chromium
```

To use a different Chromium executable, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE`. To also check real external flag images:

```sh
FLAGS_GAME_LIVE_ASSETS=1 npm test
```

## License

[MIT](LICENSE).
