import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type PlayableFlag = {
  countryName: string;
  imageUrl: string;
};

type RestCountry = {
  independent?: boolean;
  name?: {
    common?: string;
  };
  flags?: {
    svg?: string;
    png?: string;
  };
};

type Round = {
  flag: PlayableFlag;
  answerChoices: string[];
};

type Feedback = {
  selected: string;
  correct: boolean;
};

type LoadState =
  | { status: "loading" }
  | { status: "ready"; playableFlags: PlayableFlag[] }
  | { status: "error"; message: string };

type SessionState = "start" | "playing" | "finished";

const ANSWER_CHOICE_COUNT = 4;
const FEEDBACK_DURATION_MS = 500;
const MINIMUM_PLAYABLE_FLAGS = 20;
const TIME_LIMIT_SECONDS = 60;
const BEST_SCORE_KEY = "flags-game:best-score:time-challenge:v1";
const REST_COUNTRIES_URL =
  "https://restcountries.com/v3.1/all?fields=name,flags,independent";

function shuffle<T>(items: readonly T[]): T[] {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    const current = copy[index];
    const replacement = copy[swapIndex];

    if (current !== undefined && replacement !== undefined) {
      copy[index] = replacement;
      copy[swapIndex] = current;
    }
  }

  return copy;
}

function loadImage(url: string, signal: AbortSignal): Promise<string> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException("Image preload aborted", "AbortError"));
      return;
    }

    const image = new Image();

    const cleanup = () => {
      signal.removeEventListener("abort", abort);
      image.onload = null;
      image.onerror = null;
    };

    const abort = () => {
      cleanup();
      image.src = "";
      reject(new DOMException("Image preload aborted", "AbortError"));
    };

    image.onload = () => {
      cleanup();
      resolve(url);
    };
    image.onerror = () => {
      cleanup();
      reject(new Error(`Flag image failed to load: ${url}`));
    };
    signal.addEventListener("abort", abort, { once: true });
    image.src = url;
  });
}

async function resolvePlayableImage(
  country: RestCountry,
  signal: AbortSignal,
): Promise<string | null> {
  const svg = country.flags?.svg;
  const png = country.flags?.png;

  if (svg) {
    try {
      return await loadImage(svg, signal);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw error;
      }
      // The ADR requires png as a fallback when the svg cannot be loaded.
    }
  }

  if (png) {
    try {
      return await loadImage(png, signal);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw error;
      }
      return null;
    }
  }

  return null;
}

async function fetchFlagDataset(signal: AbortSignal): Promise<PlayableFlag[]> {
  const response = await fetch(REST_COUNTRIES_URL, { signal });

  if (!response.ok) {
    throw new Error(`REST Countries returned ${response.status}`);
  }

  const records = (await response.json()) as RestCountry[];
  const candidateFlags = records
    .filter((country) => country.independent === true)
    .filter((country) => Boolean(country.name?.common))
    .sort((a, b) =>
      (a.name?.common ?? "").localeCompare(b.name?.common ?? "", undefined, {
        sensitivity: "base",
      }),
    );

  const loadedFlags = await Promise.all(
    candidateFlags.map(async (country) => {
      const countryName = country.name?.common;

      if (!countryName) {
        return null;
      }

      const imageUrl = await resolvePlayableImage(country, signal);
      return imageUrl ? { countryName, imageUrl } : null;
    }),
  );

  const uniqueByName = new Map<string, PlayableFlag>();

  for (const flag of loadedFlags) {
    if (flag && !uniqueByName.has(flag.countryName)) {
      uniqueByName.set(flag.countryName, flag);
    }
  }

  return [...uniqueByName.values()];
}

async function loadPlayableFlags(): Promise<PlayableFlag[]> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 10_000);

  try {
    const playableFlags = await fetchFlagDataset(controller.signal);

    if (playableFlags.length < MINIMUM_PLAYABLE_FLAGS) {
      throw new Error(
        `Only ${playableFlags.length} Playable Flags loaded; at least ${MINIMUM_PLAYABLE_FLAGS} are required.`,
      );
    }

    return playableFlags;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Loading the Flag Dataset took longer than 10 seconds.");
    }

    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function createRound(
  playableFlags: readonly PlayableFlag[],
  flagPool: PlayableFlag[],
): Round {
  let activePool = flagPool;

  if (activePool.length === 0) {
    activePool = shuffle(playableFlags);
    flagPool.push(...activePool);
  }

  const flag = flagPool.shift();

  if (!flag) {
    throw new Error("Cannot create a Round without a Playable Flag.");
  }

  const distractors = shuffle(
    playableFlags
      .map((playableFlag) => playableFlag.countryName)
      .filter((countryName) => countryName !== flag.countryName),
  ).slice(0, ANSWER_CHOICE_COUNT - 1);

  return {
    flag,
    answerChoices: shuffle([flag.countryName, ...distractors]),
  };
}

function readStoredBestScore(): number {
  const stored = window.localStorage.getItem(BEST_SCORE_KEY);
  const parsed = stored ? Number.parseInt(stored, 10) : 0;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

export function App() {
  const [loadState, setLoadState] = useState<LoadState>({ status: "loading" });
  const [sessionState, setSessionState] = useState<SessionState>("start");
  const [round, setRound] = useState<Round | null>(null);
  const [score, setScore] = useState(0);
  const [totalGuesses, setTotalGuesses] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(TIME_LIMIT_SECONDS);
  const [bestScore, setBestScore] = useState(readStoredBestScore);
  const [startedWithBestScore, setStartedWithBestScore] = useState(bestScore);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const flagPoolRef = useRef<PlayableFlag[]>([]);
  const sessionEndsAtRef = useRef<number | null>(null);
  const feedbackTimeoutRef = useRef<number | null>(null);

  const playableFlags =
    loadState.status === "ready" ? loadState.playableFlags : [];
  const inputDisabled =
    sessionState !== "playing" || feedback !== null || remainingSeconds <= 0;
  const accuracy =
    totalGuesses === 0 ? 0 : Math.round((score / totalGuesses) * 100);
  const hasNewBestScore = score > startedWithBestScore;

  const retryLoad = useCallback(() => {
    let cancelled = false;
    setLoadState({ status: "loading" });

    loadPlayableFlags()
      .then((loadedFlags) => {
        if (!cancelled) {
          setLoadState({ status: "ready", playableFlags: loadedFlags });
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          const message =
            error instanceof Error
              ? error.message
              : "Unable to load the Flag Dataset.";
          setLoadState({ status: "error", message });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => retryLoad(), [retryLoad]);

  const finishSession = useCallback(() => {
    setSessionState("finished");
    setRemainingSeconds(0);
    setFeedback(null);

    if (feedbackTimeoutRef.current !== null) {
      window.clearTimeout(feedbackTimeoutRef.current);
      feedbackTimeoutRef.current = null;
    }
  }, []);

  const nextRound = useCallback(() => {
    if (playableFlags.length < MINIMUM_PLAYABLE_FLAGS) {
      return;
    }

    setRound(createRound(playableFlags, flagPoolRef.current));
  }, [playableFlags]);

  const startSession = useCallback(() => {
    if (loadState.status !== "ready") {
      return;
    }

    const initialPool = shuffle(loadState.playableFlags);
    flagPoolRef.current = initialPool;
    sessionEndsAtRef.current = Date.now() + TIME_LIMIT_SECONDS * 1000;
    setStartedWithBestScore(bestScore);
    setScore(0);
    setTotalGuesses(0);
    setRemainingSeconds(TIME_LIMIT_SECONDS);
    setFeedback(null);
    setRound(createRound(loadState.playableFlags, flagPoolRef.current));
    setSessionState("playing");
  }, [bestScore, loadState]);

  const submitGuess = useCallback(
    (choice: string) => {
      if (!round || inputDisabled) {
        return;
      }

      const correct = choice === round.flag.countryName;
      const nextScore = correct ? score + 1 : score;

      setFeedback({ selected: choice, correct });
      setTotalGuesses((current) => current + 1);

      if (correct) {
        setScore(nextScore);

        if (nextScore > bestScore) {
          setBestScore(nextScore);
          window.localStorage.setItem(BEST_SCORE_KEY, String(nextScore));
        }
      }

      feedbackTimeoutRef.current = window.setTimeout(() => {
        feedbackTimeoutRef.current = null;

        if (
          sessionEndsAtRef.current !== null &&
          Date.now() >= sessionEndsAtRef.current
        ) {
          finishSession();
          return;
        }

        setFeedback(null);
        nextRound();
      }, FEEDBACK_DURATION_MS);
    },
    [bestScore, finishSession, inputDisabled, nextRound, round, score],
  );

  useEffect(() => {
    if (sessionState !== "playing") {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      if (sessionEndsAtRef.current === null) {
        return;
      }

      const nextRemainingSeconds = Math.max(
        0,
        Math.ceil((sessionEndsAtRef.current - Date.now()) / 1000),
      );

      setRemainingSeconds(nextRemainingSeconds);

      if (nextRemainingSeconds <= 0) {
        finishSession();
      }
    }, 100);

    return () => window.clearInterval(intervalId);
  }, [finishSession, sessionState]);

  useEffect(() => {
    if (sessionState !== "playing" || inputDisabled || !round) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!["1", "2", "3", "4"].includes(event.key)) {
        return;
      }

      const choiceIndex = Number.parseInt(event.key, 10) - 1;
      const choice = round.answerChoices[choiceIndex];

      if (choice) {
        event.preventDefault();
        submitGuess(choice);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [inputDisabled, round, sessionState, submitGuess]);

  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current !== null) {
        window.clearTimeout(feedbackTimeoutRef.current);
      }
    };
  }, []);

  const statusText = useMemo(() => {
    if (loadState.status === "loading") {
      return "Loading the Flag Dataset and preloading Playable Flags…";
    }

    if (loadState.status === "ready") {
      return `${loadState.playableFlags.length} Playable Flags ready`;
    }

    return loadState.message;
  }, [loadState]);

  return (
    <main className="app-shell">
      <section className="game-card" aria-live="polite">
        <header className="hero">
          <p className="eyebrow">Time Challenge</p>
          <h1>Flags Guessing Game</h1>
          <p className="summary">
            Identify as many national flags as you can in 60 seconds.
          </p>
        </header>

        {sessionState === "start" && (
          <StartScreen
            bestScore={bestScore}
            loadState={loadState}
            statusText={statusText}
            onStart={startSession}
            onRetry={retryLoad}
          />
        )}

        {sessionState === "playing" && round && (
          <PlayScreen
            round={round}
            score={score}
            bestScore={bestScore}
            remainingSeconds={remainingSeconds}
            feedback={feedback}
            inputDisabled={inputDisabled}
            onGuess={submitGuess}
          />
        )}

        {sessionState === "finished" && (
          <FinalScreen
            score={score}
            bestScore={bestScore}
            accuracy={accuracy}
            totalGuesses={totalGuesses}
            hasNewBestScore={hasNewBestScore}
            onPlayAgain={startSession}
          />
        )}
      </section>
    </main>
  );
}

type StartScreenProps = {
  bestScore: number;
  loadState: LoadState;
  statusText: string;
  onStart: () => void;
  onRetry: () => void;
};

function StartScreen({
  bestScore,
  loadState,
  statusText,
  onStart,
  onRetry,
}: StartScreenProps) {
  return (
    <div className="screen stack">
      <div className="stat-grid single">
        <Metric label="Best Score" value={bestScore} />
      </div>

      <p className={loadState.status === "error" ? "status error" : "status"}>
        {statusText}
      </p>

      {loadState.status === "error" ? (
        <button className="primary-action" type="button" onClick={onRetry}>
          Retry
        </button>
      ) : (
        <button
          className="primary-action"
          type="button"
          disabled={loadState.status !== "ready"}
          onClick={onStart}
        >
          {loadState.status === "ready" ? "Start" : "Preparing…"}
        </button>
      )}
    </div>
  );
}

type PlayScreenProps = {
  round: Round;
  score: number;
  bestScore: number;
  remainingSeconds: number;
  feedback: Feedback | null;
  inputDisabled: boolean;
  onGuess: (choice: string) => void;
};

function PlayScreen({
  round,
  score,
  bestScore,
  remainingSeconds,
  feedback,
  inputDisabled,
  onGuess,
}: PlayScreenProps) {
  return (
    <div className="screen stack">
      <div className="hud" aria-label="Game Session status">
        <Metric label="Time" value={remainingSeconds} suffix="s" />
        <Metric label="Score" value={score} />
        <Metric label="Best" value={bestScore} />
      </div>

      <div className="flag-frame">
        <img src={round.flag.imageUrl} alt="Flag to identify" />
      </div>

      <div className="answer-grid" role="group" aria-label="Answer Choices">
        {round.answerChoices.map((choice, index) => {
          const isSelected = feedback?.selected === choice;
          const isCorrectChoice = choice === round.flag.countryName;
          const feedbackClass = feedback
            ? isCorrectChoice
              ? "correct"
              : isSelected
                ? "incorrect"
                : "muted"
            : "";

          return (
            <button
              className={`answer-choice ${feedbackClass}`}
              key={choice}
              type="button"
              disabled={inputDisabled}
              onClick={() => onGuess(choice)}
            >
              <span className="choice-key" aria-hidden="true">
                {index + 1}
              </span>
              <span>{choice}</span>
            </button>
          );
        })}
      </div>

      <div className="feedback-slot" aria-live="assertive">
        {feedback ? (
          <p
            className={
              feedback.correct
                ? "feedback correct-text"
                : "feedback incorrect-text"
            }
          >
            {feedback.correct ? "Correct" : `It was ${round.flag.countryName}`}
          </p>
        ) : (
          <p className="keyboard-help">Use number keys 1–4 on desktop.</p>
        )}
      </div>
    </div>
  );
}

type FinalScreenProps = {
  score: number;
  bestScore: number;
  accuracy: number;
  totalGuesses: number;
  hasNewBestScore: boolean;
  onPlayAgain: () => void;
};

function FinalScreen({
  score,
  bestScore,
  accuracy,
  totalGuesses,
  hasNewBestScore,
  onPlayAgain,
}: FinalScreenProps) {
  return (
    <div className="screen stack">
      <div className="final-banner">
        <p className="eyebrow">Final Score</p>
        <strong>{score}</strong>
        {hasNewBestScore && <span>New Best Score!</span>}
      </div>

      <div className="stat-grid">
        <Metric label="Best Score" value={bestScore} />
        <Metric label="Accuracy" value={accuracy} suffix="%" />
        <Metric label="Total Guesses" value={totalGuesses} />
      </div>

      <button className="primary-action" type="button" onClick={onPlayAgain}>
        Play Again
      </button>
    </div>
  );
}

type MetricProps = {
  label: string;
  value: number;
  suffix?: string;
};

function Metric({ label, value, suffix = "" }: MetricProps) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>
        {value}
        {suffix}
      </strong>
    </div>
  );
}
