# Flags Guessing Game

This context describes the language of a timed flag-identification game. It names the gameplay concepts a player interacts with and the score concepts used to compare attempts.

## Language

**Flag**:
The current official national flag of an independent sovereign state included in the Flag Dataset.
_Avoid_: Banner, emblem, territory flag, regional flag

**Flag Dataset**:
The collection of Flags and Country Names available to generate Rounds.
_Avoid_: API response, country list, data blob

**Playable Flag**:
A Flag with a Country Name and a successfully loadable image, available for use in Rounds.
_Avoid_: Valid country, loaded asset

**Country Name**:
The canonical display name used as an answer choice for a Flag.
_Avoid_: Official name, alias, country code, label

**Player**:
An anonymous local person playing the game on the current device.
_Avoid_: User, account, profile

**Game Mode**:
A named configuration for a Game Session that defines its time limit, Flag Dataset scope, answer choice count, and scoring rules.
_Avoid_: Difficulty, settings, quiz type

**Time Challenge**:
A Game Session where the Player has a fixed time limit to answer as many Rounds as possible.
_Avoid_: Quiz, practice mode, timed quiz

**Time Limit**:
The fixed duration of a Time Challenge.
_Avoid_: Timer, countdown

**Game Session**:
A timed sequence of Rounds played by one Player. The session ends when the Time Limit expires.
_Avoid_: Game, run, attempt

**Flag Pool**:
The set of Flags available for Rounds in a Game Session. Flags are drawn without repetition until the pool is exhausted, then the pool is refilled.
_Avoid_: Queue, deck, remaining countries

**Round**:
A single guessing challenge in which the Player is shown one Flag and must identify its sovereign state from four Answer Choices.
_Avoid_: Question, prompt, card

**Answer Choice**:
A Country Name shown as one of the selectable options in a Round.
_Avoid_: Option, answer, button text

**Distractor**:
An incorrect Answer Choice shown alongside the correct Country Name.
_Avoid_: Wrong answer, decoy, fake option

**Guess**:
The Player's selected Answer Choice for a Round.
_Avoid_: Response, submission, click

**Feedback**:
The brief indication shown after a Guess to communicate whether it was correct.
_Avoid_: Result, toast, animation

**Score**:
The number of correct Guesses during a Game Session.
_Avoid_: Points, total, count

**Total Guesses**:
The number of Guesses made during a Game Session.
_Avoid_: Attempts, answers, clicks

**Accuracy**:
The percentage of Guesses that were correct during a Game Session.
_Avoid_: Success rate, hit rate

**Best Score**:
The highest Score achieved by a Player during any Time Challenge.
_Avoid_: High score, max score, cached score, record

**Final Score**:
The Score shown after a Game Session ends.
_Avoid_: Result score, ending score
