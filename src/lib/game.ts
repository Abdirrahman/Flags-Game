import { countryListAlpha2, countryAliases } from "./countries";

export type GameMode = "typed" | "choice";
export type ModeProgress = {
  streak: number;
  bestStreak: number;
  correctAnswers: number;
};
export type Progress = Record<GameMode, ModeProgress>;
export type Country = { code: string; name: string };
export type Round = { country: Country; choices: Country[] };

export const PROGRESS_KEY = "flags-game:progress:v1";
// These territories use the same national flag as another entry. Excluding them
// prevents an indistinguishable flag from having two competing country answers.
const sharedFlagCodes = new Set(["BV", "SJ", "UM", "MF", "HM"]);
export const countries: Country[] = Object.entries(countryListAlpha2)
  .filter(([code]) => !sharedFlagCodes.has(code))
  .map(([code, name]) => ({ code: code.toLowerCase(), name }));

function shuffle<T>(items: readonly T[]): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const other = Math.floor(Math.random() * (index + 1));
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}

export function createRound(previousCode?: string): Round {
  const available = countries.filter(({ code }) => code !== previousCode);
  const country = available[Math.floor(Math.random() * available.length)];
  const distractors = shuffle(
    countries.filter(({ code }) => code !== country.code),
  ).slice(0, 3);
  return { country, choices: shuffle([country, ...distractors]) };
}

export function normalizeAnswer(answer: string): string {
  return answer
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]/g, "")
    .replace(/^the/, "");
}

export function isCorrectAnswer(country: Country, answer: string): boolean {
  const normalized = normalizeAnswer(answer);
  if (!normalized) return false;
  const accepted = [country.name, ...(countryAliases[country.code.toUpperCase()] ?? [])];
  return accepted.some((name) => normalizeAnswer(name) === normalized);
}

export function recordGuess(progress: ModeProgress, correct: boolean): ModeProgress {
  const streak = correct ? progress.streak + 1 : 0;
  return {
    streak,
    bestStreak: Math.max(progress.bestStreak, streak),
    correctAnswers: progress.correctAnswers + (correct ? 1 : 0),
  };
}

function storedCount(value: unknown): number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0
    ? value
    : 0;
}

function validateProgress(value: unknown): ModeProgress {
  const saved = value && typeof value === "object" ? value as Partial<ModeProgress> : {};
  const streak = storedCount(saved.streak);
  return {
    streak,
    bestStreak: Math.max(streak, storedCount(saved.bestStreak)),
    correctAnswers: Math.max(streak, storedCount(saved.correctAnswers)),
  };
}

export function readProgress(): Progress {
  const progress: Progress = {
    typed: { streak: 0, bestStreak: 0, correctAnswers: 0 },
    choice: { streak: 0, bestStreak: 0, correctAnswers: 0 },
  };
  try {
    const stored = window.localStorage.getItem(PROGRESS_KEY);
    if (stored) {
      try {
        const parsed: unknown = JSON.parse(stored);
        if (parsed && typeof parsed === "object") {
          const saved = parsed as Partial<Progress>;
          progress.typed = validateProgress(saved.typed);
          progress.choice = validateProgress(saved.choice);
        }
      } catch {
        // Ignore malformed saved progress, but still preserve the old high score.
      }
    }
    const legacyBest = Number(window.localStorage.getItem("HiScore"));
    progress.typed.bestStreak = Math.max(progress.typed.bestStreak, storedCount(legacyBest));
  } catch {
    // Private or restricted browsers can deny local storage; the game still works.
  }
  return progress;
}

export function writeProgress(progress: Progress): boolean {
  try {
    window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
    return true;
  } catch {
    return false;
  }
}
