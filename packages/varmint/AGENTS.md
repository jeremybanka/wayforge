# varmint

## Purpose

Varmint wraps slow, expensive, flaky, or external asynchronous work in
filesystem-backed fixtures so tests can run deterministically without calling
the real dependency every time.

## Mental model

- Treat each wrapped function as a fixture collection named by the key passed to
  `add`.
- Treat each scenario as a stable fixture case named by the subKey passed to
  `for`.
- Varmint records the exact call arguments beside the captured result, then
  requires those arguments to match when replaying.
- The cache is intentionally visible on disk; fixture diffs are reviewable test
  artifacts, not hidden mocks.
- Prefer stable, human-readable keys and subKeys because they become filenames
  after sanitization.

## Core APIs

### Squirrel

Use `Squirrel` for Promise-returning functions.

- Input fixture: `<baseDir>/<key>/<subKey>.input.json`
- Output fixture: `<baseDir>/<key>/<subKey>.output.json`

### Ferret

Use `Ferret` for functions that return `AsyncIterable` streams.

- Input fixture: `<baseDir>/<key>/<subKey>.input.json`
- Stream fixture: `<baseDir>/<key>/<subKey>.stream.txt`

## Cache modes

- `off`: Call the wrapped function directly and do not read or write fixtures.
- `read`: Replay existing fixtures only; cache misses fail and should fail CI.
- `write`: Call the wrapped function and overwrite fixtures.
- `read-write`: Replay fixtures when present; call the real function and write a
  fixture on misses.

## Caching mode policy

Establish one project-level caching mode variable and pass it to every
`Squirrel` or `Ferret` instance. Avoid choosing the mode separately at each call
site; scattered policy makes it easy for one test to write fixtures while
another test expects strict replay.

Recommended default:

```ts
import type { CacheMode } from "varmint"

export const VARMINT_MODE: CacheMode = process.env[`CI`]
	? `read`
	: process.env[`NODE_ENV`] === `production`
		? `off`
		: `read-write`
```

- Use `read` in CI so fixture misses are visible failures.
- Use `off` in production builds or runtime code so Varmint never records or
  replays test fixtures there.
- Use `read-write` for local development so new scenarios can be captured
  naturally.
- Prefer an explicit override only for intentional maintenance tasks, such as
  regenerating fixtures with `write`.

## Basic workflow

- Wrap the boundary you want to stabilize with
  `new Squirrel(mode).add(key, fn)` or
  `new Ferret(mode).add(key, streamFn)`.
- In local development, use `read-write` to keep existing fixtures fast while
  allowing new scenarios to be captured.
- In CI, use `read` so tests prove all external behavior is represented by
  committed fixtures.
- When behavior intentionally changes, run in `write` or delete the affected
  fixture and rerun in `read-write`.
- Commit the updated `.varmint` fixture files with the test change so future runs
  replay the same behavior.
- Avoid manually editing fixtures in normal use. Their job is to document and
  cache real calls, so regenerate them from the wrapped interaction when the
  underlying behavior changes.
- Use `flush` after a suite to remove fixture cases that were not touched by the
  current test run.

## Failure model

- A missing fixture in `read` mode means the test is asking for behavior that has
  not been recorded.
- An input mismatch means the scenario name still exists, but the arguments
  changed; update the fixture or choose a new subKey.
- Cache-miss errors include the nearest recorded input to make accidental
  argument drift easier to spot.

## Testing guidance

- Keep wrappers at process or service boundaries such as network calls, model
  calls, or expensive async helpers.
- Also reach for Varmint around inherently unpredictable values such as random
  generation, dates, clocks, or Temporal values.
- More generally, use Varmint anywhere your code has an unpredictable
  interaction with the outside world and you want that interaction to become
  predictable in tests.
- Avoid wrapping pure in-process logic; test that directly.
- Make fixture names describe the behavior under test, not incidental
  implementation details.
- Review fixture changes like snapshots: small intentional diffs are useful,
  broad churn is suspicious, and hand-edited fixture contents should be rare.
