# Use Mobile-First Responsive Web Interactions

V1 is a responsive web game with a mobile-first layout. The interaction model prioritizes fast touch play while preserving desktop keyboard support and basic accessibility.

## Consequences

- The Start screen shows Best Score and a Start action; the timer does not begin automatically and there is no countdown in v1.
- During a Time Challenge, the HUD shows remaining time, current Score, and Best Score; Accuracy is shown only after the Game Session ends.
- After each Guess, show Feedback for 500ms, then automatically advance; the Time Limit continues during Feedback.
- Desktop Players can use number keys `1` through `4` to select the corresponding Answer Choice.
- Answer input, including keyboard input, is disabled during Feedback and after the Time Limit expires.
- Answer Choices should be semantic buttons with visible focus states and sufficient contrast.
- During gameplay, the flag image must use non-revealing alt text such as `Flag to identify`.
