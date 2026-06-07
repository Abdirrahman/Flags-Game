# Generate Rounds Locally During Time Challenges

The app fetches and prepares the Flag Dataset before a Time Challenge starts, then generates all Rounds locally during the 60-second session. This preserves the fairness and pace of timed play by ensuring API latency cannot consume the Player's Time Limit.

## Consequences

- No API calls should be required during an active Time Challenge.
- The app should show loading before Start and an error with Retry if loading fails or exceeds 10 seconds.
- Playable flag images should be preloaded before enabling Start.
- If `flags.svg` and `flags.png` both fail for a Flag, that Flag is excluded.
- The Time Challenge can start only when at least 20 Playable Flags remain.
