import { expect, test } from "@playwright/test";
import {
  countries, createRound, isCorrectAnswer, recordGuess,
  readProgress, writeProgress, PROGRESS_KEY,
} from "../src/lib/game";

const country = (code: string) => countries.find((entry) => entry.code === code)!;

test("common names and aliases match without confusing distinct flags", () => {
  expect(new Set(countries.map((entry) => entry.name)).size).toBe(countries.length);
  for (const entry of countries) expect(isCorrectAnswer(entry, entry.name)).toBe(true);
  for (const [code, answer] of [
    ["sy", " Syria "], ["us", "U.S.A."], ["gb", "uk"], ["ci", "Côte d’Ivoire"],
    ["kr", "South Korea"], ["kp", "North Korea"], ["la", "Laos"],
    ["cz", "Czech Republic"], ["vn", "Viet Nam"],
  ]) expect(isCorrectAnswer(country(code), answer)).toBe(true);
  expect(isCorrectAnswer(country("kr"), "North Korea")).toBe(false);
  expect(isCorrectAnswer(country("cd"), "Republic of the Congo")).toBe(false);
  expect(isCorrectAnswer(country("cg"), "DR Congo")).toBe(false);
  expect(isCorrectAnswer(country("sy"), "   ")).toBe(false);
});

test("rounds have four distinct shuffled choices and avoid immediate flag repeats", () => {
  for (const duplicate of ["bv", "sj", "um", "mf", "hm"]) {
    expect(countries.some((entry) => entry.code === duplicate)).toBe(false);
  }
  const positions = new Set<number>();
  let previous: string | undefined;
  for (let index = 0; index < 500; index += 1) {
    const round = createRound(previous);
    expect(round.choices).toHaveLength(4);
    expect(new Set(round.choices.map((choice) => choice.code)).size).toBe(4);
    expect(round.choices.filter((choice) => choice.code === round.country.code)).toHaveLength(1);
    expect(round.country.code).not.toBe(previous);
    positions.add(round.choices.findIndex((choice) => choice.code === round.country.code));
    previous = round.country.code;
  }
  expect(positions.size).toBe(4);
});

test("wrong guesses reset only the current streak", () => {
  const initial = { streak: 0, bestStreak: 0, correctAnswers: 0 };
  const progress = recordGuess(recordGuess(initial, true), true);
  expect(progress).toEqual({ streak: 2, bestStreak: 2, correctAnswers: 2 });
  expect(recordGuess(progress, false)).toEqual({ streak: 0, bestStreak: 2, correctAnswers: 2 });
});

test("saved progress validates corrupted values and preserves the legacy best", () => {
  const saved = new Map<string, string>([["HiScore", "7"]]);
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { localStorage: {
      getItem: (key: string) => saved.get(key) ?? null,
      setItem: (key: string, value: string) => saved.set(key, value),
    } },
  });
  try {
    const progress = readProgress();
    expect(progress.typed.bestStreak).toBe(7);
    expect(progress.choice.bestStreak).toBe(0);
    progress.choice = { streak: 2, bestStreak: 4, correctAnswers: 9 };
    expect(writeProgress(progress)).toBe(true);
    expect(readProgress().choice).toEqual(progress.choice);
    saved.set(PROGRESS_KEY, "bad-json");
    expect(readProgress().typed.bestStreak).toBe(7);
    saved.set(PROGRESS_KEY, JSON.stringify({
      typed: { streak: -1, bestStreak: "200", correctAnswers: 4.5 },
      choice: { streak: 3, bestStreak: 1, correctAnswers: 2 },
    }));
    expect(readProgress().choice).toEqual({ streak: 3, bestStreak: 3, correctAnswers: 3 });
    expect(readProgress().typed).toEqual({ streak: 0, bestStreak: 7, correctAnswers: 0 });
  } finally {
    Reflect.deleteProperty(globalThis, "window");
  }
});

test("blocked or full storage cannot break gameplay", () => {
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    get: () => { throw new Error("storage blocked"); },
  });
  try {
    const progress = readProgress();
    expect(progress.typed.streak).toBe(0);
    expect(writeProgress(progress)).toBe(false);
  } finally {
    Reflect.deleteProperty(globalThis, "window");
  }
});
