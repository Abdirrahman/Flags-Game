import * as React from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { ModeToggle } from "./ModeToogle";
import { Github } from "lucide-react";
import {
  createRound,
  isCorrectAnswer,
  readProgress,
  recordGuess,
  writeProgress,
  type GameMode,
} from "@/lib/game";

type Feedback = { correct: boolean; countryName: string; selected: string };

export default function Game() {
  const [mode, setMode] = React.useState<GameMode>("typed");
  const [round, setRound] = React.useState(() => createRound());
  const [progress, setProgress] = React.useState(readProgress);
  const [answer, setAnswer] = React.useState("");
  const [feedback, setFeedback] = React.useState<Feedback | null>(null);
  const [isAdvancing, setIsAdvancing] = React.useState(false);
  const [flagStatus, setFlagStatus] = React.useState<"loading" | "ready" | "error">("loading");
  const [canSave, setCanSave] = React.useState(true);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const hintRef = React.useRef<HTMLDetailsElement>(null);
  const answerGridRef = React.useRef<HTMLDivElement>(null);
  const restoreAnswerFocusRef = React.useRef(false);
  const roundLockedRef = React.useRef(false);
  const feedbackTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const stats = progress[mode];
  const inputDisabled = isAdvancing || flagStatus !== "ready";

  React.useEffect(() => {
    setCanSave(writeProgress(progress));
  }, [progress]);

  React.useEffect(() => () => {
    if (feedbackTimeoutRef.current !== null) {
      clearTimeout(feedbackTimeoutRef.current);
    }
  }, []);


  React.useEffect(() => {
    if (inputDisabled || !restoreAnswerFocusRef.current) return;
    restoreAnswerFocusRef.current = false;
    if (mode === "typed") {
      inputRef.current?.focus({ preventScroll: true });
    } else {
      answerGridRef.current?.querySelector<HTMLButtonElement>("button")?.focus({ preventScroll: true });
    }
  }, [inputDisabled, mode]);


  function nextRound() {
    roundLockedRef.current = false;
    setAnswer("");
    setFlagStatus("loading");
    setRound((previous) => createRound(previous.country.code));
    if (hintRef.current) hintRef.current.open = false;
  }

  const submitGuess = React.useCallback((guess: string) => {
    if (inputDisabled || roundLockedRef.current || !guess.trim()) return;
    roundLockedRef.current = true;
    const activeElement = document.activeElement;
    restoreAnswerFocusRef.current = activeElement instanceof HTMLElement &&
      activeElement.closest(".answer-form, .answer-grid") !== null;
    const correct = isCorrectAnswer(round.country, guess);
    setProgress((current) => ({
      ...current,
      [mode]: recordGuess(current[mode], correct),
    }));
    setFeedback({ correct, countryName: round.country.name, selected: guess });
    setIsAdvancing(true);
    setAnswer("");
    feedbackTimeoutRef.current = setTimeout(() => {
      feedbackTimeoutRef.current = null;
      setIsAdvancing(false);
      nextRound();
    }, 500);
  }, [inputDisabled, mode, round]);

  React.useEffect(() => {
    if (mode !== "choice" || inputDisabled) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.altKey || event.metaKey || event.repeat) return;
      const target = event.target;
      if (target instanceof HTMLElement && (
        target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
      )) return;
      if (!/^[1-4]$/.test(event.key)) return;
      const choice = round.choices[Number(event.key) - 1];
      if (choice) {
        event.preventDefault();
        submitGuess(choice.name);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [inputDisabled, mode, round, submitGuess]);

  function changeMode(nextMode: GameMode) {
    if (mode === nextMode || isAdvancing) return;
    restoreAnswerFocusRef.current = false;
    setMode(nextMode);
    setFeedback(null);
    nextRound();
  }

  const hint = round.country.name
    .split("")
    .map((character, index) => character === " " || index % 2 === 0 ? character : "_")
    .join("");

  return (
    <main className="game-shell">
      <div className="game-toolbar">
        <Button asChild variant="outline" size="icon">
          <a
            href="https://github.com/Abdirrahman/Flags-Game"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View Flags Game on GitHub"
          >
            <Github aria-hidden="true" />
          </a>
        </Button>
        <ModeToggle />
      </div>

      <header className="game-header">
        <h1>Flags Game</h1>
        <p className="game-description">Name the flag. Keep your streak going.</p>
      </header>

      <fieldset className="mode-picker">
        <legend>How do you want to play?</legend>
        <div className="mode-options">
          <Button
            type="button"
            variant={mode === "typed" ? "default" : "outline"}
            className="mode-option"
            aria-pressed={mode === "typed"}
            disabled={isAdvancing}
            onClick={() => changeMode("typed")}
          >
            Type answer
          </Button>
          <Button
            type="button"
            variant={mode === "choice" ? "default" : "outline"}
            className="mode-option"
            aria-pressed={mode === "choice"}
            disabled={isAdvancing}
            onClick={() => changeMode("choice")}
          >
            Multiple choice
          </Button>
        </div>
      </fieldset>

      <section className="scoreboard" aria-label="Your progress">
        <Metric label="Current streak" value={stats.streak} />
        <Metric label="Best streak" value={stats.bestStreak} />
        <Metric label="Total correct" value={stats.correctAnswers} />
      </section>

      <div className="flag-frame" aria-busy={flagStatus === "loading"}>
        <img
          key={round.country.code}
          src={`https://flagcdn.com/${round.country.code}.svg`}
          alt="Flag to identify"
          onLoad={() => setFlagStatus("ready")}
          onError={() => setFlagStatus("error")}
        />
      </div>

      {flagStatus === "error" && (
        <div className="flag-error" role="alert">
          <p>This flag couldn’t load. Check your connection or try another flag.</p>
          <Button type="button" variant="outline" onClick={nextRound}>Try another flag</Button>
        </div>
      )}

      {mode === "typed" ? (
        <form className="answer-form" onSubmit={(event) => {
          event.preventDefault();
          submitGuess(answer);
        }}>
          <label htmlFor="guess" className="answer-label">Country name</label>
          <div className="answer-entry">
            <Input
              ref={inputRef}
              id="guess"
              className="guess-input"
              type="text"
              name="guess"
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              placeholder="Enter the country name"
              autoComplete="off"
              autoCapitalize="words"
              spellCheck={false}
              readOnly={inputDisabled}
              aria-describedby="game-feedback"
            />
            <Button
              className="submit-answer"
              type="submit"
              disabled={inputDisabled || !answer.trim()}
            >
              Check answer
            </Button>
          </div>
        </form>
      ) : (
        <div ref={answerGridRef} className="answer-grid" role="group" aria-label="Answer choices">
          {round.choices.map((choice, index) => (
            <Button
              key={choice.code}
              type="button"
              variant="outline"
              className="answer-choice"
              disabled={inputDisabled}
              data-feedback={isAdvancing && feedback
                ? choice.code === round.country.code ? "correct"
                  : feedback.selected === choice.name ? "incorrect" : "muted"
                : undefined}
              onClick={() => submitGuess(choice.name)}
            >
              <span className="choice-key" aria-hidden="true">{index + 1}</span>
              <span className="country-name">{choice.name}</span>
            </Button>
          ))}
        </div>
      )}

      <div className="feedback-slot" id="game-feedback" role="status" aria-live="polite" aria-atomic="true">
        {feedback ? (
          <p className="feedback" data-correct={feedback.correct}>
            {feedback.correct ? "Correct!" : "Incorrect."} That was {feedback.countryName}.
          </p>
        ) : (
          <p className="game-help">
            {flagStatus === "loading" ? "Loading flag…" : mode === "typed"
              ? "Press Enter or check your answer."
              : "Choose an answer or use number keys 1–4."}
          </p>
        )}
      </div>

      <footer className="game-footer">
        <details ref={hintRef}>
          <summary>Show a hint</summary>
          <p>{hint}</p>
        </details>
        <p className="saved-note">
          {canSave
            ? "Each mode’s progress is saved on this browser."
            : "Local saving is unavailable. Progress will last until you leave this page."}
        </p>
      </footer>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="game-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
