<div align="center">

<samp>THE 60-SECOND FLAG CHALLENGE</samp>

# Flags Guessing Game

**One flag. Four choices. Beat your best.**

A quick geography challenge for your browser, built for mouse, touch, and keyboard.

[![React](https://img.shields.io/badge/React-19-3155d4?style=flat-square)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3155d4?style=flat-square)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8-3155d4?style=flat-square)](https://vite.dev/)
[![Bun](https://img.shields.io/badge/Bun-powered-172033?style=flat-square)](https://bun.sh/)

[How to play](#how-to-play) · [Quick start](#quick-start) · [Build & deploy](#build--deploy) · [Under the hood](#under-the-hood)

<br>

<img src="docs/images/gameplay.jpg" alt="Flags Guessing Game during a Time Challenge: the Swiss flag, four country choices, and the time, score, and best-score counters." width="1100">

<sub>The current game interface, captured with a local sample dataset.</sub>

</div>

<br>

| Race the clock | Learn as you play | Keep your best |
| :--- | :--- | :--- |
| Identify as many flags as you can in **60 seconds**. | Four shuffled choices and immediate answer feedback. | Your best score stays saved in this browser. |

## How to play

1. **Get ready.** Wait for the flags to load, then select **Start**.
2. **Make your guess.** Click or tap a country, or press **1**, **2**, **3**, or **4**.
3. **Keep going.** Each correct guess adds one to your score. A wrong guess costs no points; the correct answer is highlighted before the next round.
4. **Try again.** When time runs out, see your score, total guesses, accuracy, and personal best. Select **Play Again** for another challenge.

Flags come from a shuffled pool and do not repeat until the pool is exhausted. No account is needed. Your best score is stored locally; clearing site data resets it.

## Quick start

Install [Bun](https://bun.sh/), then:

```sh
git clone https://github.com/Abdirrahman/Flags-Game.git
cd Flags-Game
bun install --frozen-lockfile
bun dev
```

Open the URL printed in your terminal, normally **http://localhost:5173**. Verified with Bun **1.3.14**.

> [!IMPORTANT]
> The game's REST Countries v3.1 endpoint has been [retired](https://restcountries.com/docs/countries/legacy-api-deprecation), so live flag loading currently needs an API migration. The screenshot above uses local sample data to show the gameplay interface.

## Build & deploy

```sh
bun run build     # Check TypeScript and create the production build
bun run preview   # Preview the build locally
```

Preview normally runs at **http://localhost:4173**. To deploy, publish the contents of **`dist/`** to a static web host. The app runs in the browser and has no backend.

Both development and preview servers listen on all network interfaces, so you can test from another device on the same network.

## Under the hood

<details>
<summary><strong>Flag data & loading</strong></summary>

<br>

The app requests country names and flag image URLs from REST Countries, keeps records marked as independent, and removes duplicate country names. It preloads SVG flags first, falls back to PNG, and excludes records whose images cannot load.

A challenge requires at least **20 playable flags**. Loading times out after **10 seconds**, with a **Retry** button on failure. Internet access to the country API and image hosts is required when opening or reloading the game. After loading, rounds are generated locally.

The retired endpoint is configured in [`src/App.tsx`](src/App.tsx).

</details>

<details>
<summary><strong>Dependency maintenance</strong></summary>

<br>

Commit `bun.lock` with dependency updates to keep installations reproducible. Before pushing an update, run:

```sh
bun audit
bun run build
```

[Dependabot](.github/dependabot.yml) checks Bun dependencies for updates weekly.

</details>

<details>
<summary><strong>Project map</strong></summary>

<br>

| File | Purpose |
| :--- | :--- |
| [`src/App.tsx`](src/App.tsx) | Data loading, rounds, scoring, timer, and game screens |
| [`src/styles.css`](src/styles.css) | Responsive layout and visual feedback |
| [`src/main.tsx`](src/main.tsx) | React entry point |
| [`CONTEXT.md`](CONTEXT.md) | Gameplay terminology |
| [`docs/adr/`](docs/adr/) | Architectural decisions and challenge scope |

</details>
