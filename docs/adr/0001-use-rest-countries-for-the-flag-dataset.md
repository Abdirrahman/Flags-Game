# Use REST Countries for the Flag Dataset

The game uses the REST Countries API as the remote source for the v1 Flag Dataset instead of bundling a local country-and-flag dataset. This keeps initial data maintenance low and gives the app a ready source for country names and flag image URLs, at the cost of requiring a successful network load before play can begin.

## Consequences

- A Time Challenge must not start until the Flag Dataset is loaded and enough Playable Flags are available.
- REST Countries records are playable only when `independent === true`.
- The canonical Country Name is `name.common`.
- The displayed flag image should use `flags.svg` as a URL source, with `flags.png` as fallback.
