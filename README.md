# Flags Guessing Game

A Bun-powered React implementation of the 60-second Time Challenge described in `CONTEXT.md` and `docs/adr/`.

## Run locally

```sh
bun install
bun dev
```

## Build

```sh
bun run build
```

## Gameplay rules

- Loads independent sovereign states from REST Countries before play starts.
- Preloads flag images and excludes records whose SVG and PNG both fail.
- Starts only after at least 20 Playable Flags are available.
- Runs a single 60-second Time Challenge with four Answer Choices per Round.
- Draws correct answers from a shuffled Flag Pool without repetition until exhausted.
- Stores the local Best Score for the v1 Time Challenge in browser storage.
