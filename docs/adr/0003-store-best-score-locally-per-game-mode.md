# Store Best Score Locally Per Game Mode

The v1 Player is anonymous and local to the current device, so Best Score is persisted locally rather than tied to an account or leaderboard. Best Score is associated with the Game Mode, which keeps future modes or rule changes from being compared against incompatible scores.

## Consequences

- V1 has one Game Mode: Time Challenge.
- Best Score updates immediately whenever the current Score exceeds the previous Best Score, even before the Game Session ends.
- Clearing local browser storage or changing devices may lose the Player's Best Score.
