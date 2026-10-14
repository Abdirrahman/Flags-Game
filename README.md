# Flags Guessing Game

A browser game built with React, TypeScript, Vite, and Bun. Identify as many national flags as you can in a 60-second Time Challenge.

## How to play

1. Wait for the flags to load, then select **Start**.
2. Choose the country matching each flag by clicking or tapping an answer, or pressing **1–4** on your keyboard.
3. Each correct guess adds one to your score. Incorrect guesses do not subtract points. Brief feedback highlights the correct answer before the next round.
4. When time runs out, see your final score, total guesses, accuracy, and best score. Select **Play Again** for another challenge.

Flags are drawn from a shuffled pool without repetition until the pool is exhausted. Your best score is saved in this browser's local storage; clearing site data resets it. No account or backend is required.

## Run locally

Install [Bun](https://bun.sh/) first. The project has been verified with Bun 1.3.14.

```sh
git clone https://github.com/Abdirrahman/Flags-Game.git
cd Flags-Game
bun install --frozen-lockfile
bun dev
```

Open the local URL printed by Vite, normally `http://localhost:5173`. The development and preview servers listen on all network interfaces, so you can also test from another device on the same network.

## Build and preview

```sh
bun run build
bun run preview
```

The build checks TypeScript and writes the static site to `dist/`. Preview serves that build locally, normally at `http://localhost:4173`. Deploy the contents of `dist/` to a static web host.

## Flag data and loading

The browser loads country names and flag image URLs from [REST Countries](https://restcountries.com/v3.1/all?fields=name,flags,independent), keeping records marked as independent and removing duplicate country names. Images are preloaded, with SVG preferred and PNG used as a fallback. Records whose images cannot load are excluded.

At least 20 playable flags must load before a challenge can start. Loading times out after 10 seconds; select **Retry** if the service or images are unavailable. Internet access to REST Countries and the image hosts is required when opening or reloading the game. Rounds are generated locally after loading completes.

## Dependency security

Commit `bun.lock` with dependency updates so installations use the verified versions. Check the dependency tree with:

```sh
bun audit
```

After updating dependencies, run `bun audit` and `bun run build` before pushing changes.

[Dependabot](.github/dependabot.yml) checks the Bun dependencies for updates weekly.

## Project layout

- [`src/App.tsx`](src/App.tsx) — dataset loading, round generation, scoring, timer, and game screens.
- [`src/styles.css`](src/styles.css) — responsive layout and visual feedback.
- [`src/main.tsx`](src/main.tsx) — React entry point.
- [`CONTEXT.md`](CONTEXT.md) — gameplay terminology.
- [`docs/adr/`](docs/adr/) — architectural decisions and the scope of the Time Challenge.
