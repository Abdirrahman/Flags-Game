# Define V1 as a Single 60-Second Time Challenge

V1 has one Game Mode: Time Challenge, a 60-second session with unlimited Rounds, four Answer Choices, random Distractors, and no difficulty levels. Keeping one mode makes Best Score comparable and lets the first implementation focus on the core speed-based guessing loop.

## Consequences

- Correct Guesses add 1 to Score.
- Incorrect Guesses add 0 to Score, count toward Total Guesses, lower Accuracy, and advance after Feedback.
- There is no skip action in v1.
- The Time Challenge ends immediately when the Time Limit expires; input is disabled and an unanswered current Round is not scored.
- The final screen shows Final Score, Best Score, whether a new Best Score was achieved, Accuracy, and Play Again.
