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
- Varmint cannot see configuration captured by a closure or read elsewhere.
  Callers are responsible for making every result-affecting input part of the
  fixture contract.
- The cache is intentionally visible on disk; fixture diffs are reviewable test
  artifacts, not hidden mocks.
- Prefer stable, human-readable keys and subKeys because they shape fixture
  paths. SubKeys are sanitized, so distinct labels containing unsupported
  characters can collapse to the same filename.

## Core APIs

### Squirrel

Use `Squirrel` for Promise-returning functions.

- Input fixture: `<baseDir>/<key>/<subKey>.input.json`
- Output fixture: `<baseDir>/<key>/<subKey>.output.json`

### Ferret

Use `Ferret` for functions that return `AsyncIterable` streams.

- Input fixture: `<baseDir>/<key>/<subKey>.input.json`
- Stream fixture: `<baseDir>/<key>/<subKey>.stream.txt`

### Input format

The `.input.json` file contains the wrapped function's positional argument
list. A one-argument call therefore records an array:

```json
[
	"the prompt"
]
```

Do not add an unnecessary wrapper such as `{ "input": value }` solely to change
fixture formatting.

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
		: process.env[`RECORD_FIXTURES`] === `1`
			? `write`
			: `read`
```

- Use `read` for ordinary local tests and CI so fixture misses are visible
  failures and routine test runs cannot make live calls.
- Use `off` in production builds or runtime code so Varmint never records or
  replays test fixtures there.
- Expose `write` or `read-write` only through an explicitly named fixture
  recording command.
- Use `write` when the selected run should authoritatively regenerate every
  exercised fixture.
- Use `read-write` for deliberate incremental recording only when a cache miss
  making a silent live call is cheap, side-effect free, and otherwise
  acceptable.

## Basic workflow

- Wrap the boundary you want to stabilize with
  `new Squirrel(mode).add(key, fn)` or
  `new Ferret(mode).add(key, streamFn)`.
- Run ordinary local and CI tests in `read`.
- When behavior intentionally changes, use the explicit recording command to
  run the affected scenarios in `write`. An explicit `read-write` recording
  command can be used when incremental live capture is intentional.
- Commit the updated `.varmint` fixture files with the test change so future runs
  replay the same behavior.
- Avoid manually editing fixtures in normal use. Their job is to document and
  cache real calls, so regenerate them from the wrapped interaction when the
  underlying behavior changes.

## Choosing the wrapper boundary

Record the stable, safe value that actually crosses the external boundary, not
an upstream application object that will later be transformed into that value.

```ts
// Avoid: the fixture captures a large internal object.
await cachedGenerateTurn.for(caseName).get(gameState)

// Prefer: the fixture captures the dependency-facing request.
await cachedModelCall.for(caseName).get({
	model,
	systemPrompt,
	userPrompt: renderPrompt(gameState),
	outputSchemaVersion,
	reasoning,
})
```

If fixture diffs are unexpectedly large, dominated by internal state, or
difficult to interpret, the wrapper is probably too high in the stack.

For model calls, the reviewable input is usually a safe representation of the
outbound generation request. Do not include authorization headers or other
transport credentials.

## Semantic identity

- Explicit arguments are the primary fixture identity. Include every safe input
  that can change the result, such as model identity, system instructions,
  output-contract versions, provider settings, endpoint or API versions,
  feature flags, and prompt-template or parser versions.
- Configuration captured by a closure is invisible to Varmint. Prefer adapting
  the wrapped function to accept a safe request object containing the complete
  semantic contract.
- Use readable behavioral keys and subKeys for navigation. When relevant
  contract information cannot reasonably be explicit, add a deterministic
  fingerprint to the case identity, for example
  `round-2-trick-4-play-3-P1--a701b47efab7`.
- A fingerprint supplements explicit arguments; it does not replace them.
  Document what it covers, compute it deterministically, and exclude secrets and
  secret-derived values.
- Because filename sanitization can make distinct labels collide, use an
  explicit disambiguator or fingerprint when labels differ only by characters
  that sanitize the same way.

## Secrets and private data

- Varmint writes exact arguments and results to disk. Never record credentials,
  authorization headers, secrets, or unnecessary personal or private data.
- Hashing a secret is not safe redaction, particularly for low-entropy values.
  Semantic fingerprints must exclude secrets and secret-derived values.
- Define a minimal safe request at the wrapper boundary and inspect generated
  fixture files before staging them.

## Replay layering

- Usually cache the raw external result, then run parsing, schema validation,
  legality checks, retries, and deterministic fallbacks outside the cache. This
  lets replay exercise the application's handling of malformed or invalid
  dependency behavior.
- Do not edit a fixture merely because the external result is poor. Invalid
  outputs are often valuable regression cases.
- A cached result does not imply that the application accepted it. When the
  distinction matters, assert the raw result, guarded decision, fallback, and
  committed action separately.
- If a retry sends a different outbound request, give the attempt a stable case
  identity so its fixture remains independently reviewable.

## Source control and provenance

- If CI uses `read`, verify that every required input and output fixture is
  tracked rather than merely present locally. Check ignore rules, staged fixture
  counts, and final committed paths.
- Track durable replay evidence. Keep transient reports, costs, timestamps, and
  local diagnostics ignored unless the project explicitly treats them as golden
  data.
- Scenario labels describe intended provenance; they do not prove that a live
  dependency call occurred. When provenance matters, instrument recording runs
  to count live calls, cached replays, invalid results, fallbacks, and committed
  actions.
- For expensive recording jobs, persist useful diagnostics before enforcing
  quality assertions. Fixture validity and model quality are separate concerns;
  a faithfully replayed fallback can be a valid fixture.

## Fixture cleanup and concurrency

- `flush` removes fixture cases that were not touched through the current
  `Squirrel` or `Ferret` instance. Use it only when the run authoritatively
  enumerates the entire collection.
- Do not flush after a filtered or partial test run. Cases omitted by that run
  would be treated as stale.
- Instance `flush` only examines collection keys touched by that instance. It
  does not discover or remove an entirely orphaned collection directory.
- Do not let concurrent writers or flushers share a mutable fixture directory.
  Give parallel agents and test processes isolated cache roots. Sharing is safe
  only when every participant is read-only.
- Run deliberate recording and cleanup jobs in isolation, and review deletions
  before committing them.

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
- Prefer seeded randomness, injected clocks, and deterministic identifiers for
  nondeterminism owned by the application.
- Use Varmint for nondeterministic values when they genuinely cross an external
  or otherwise difficult-to-control boundary.
- More generally, use Varmint anywhere your code has an unpredictable
  interaction with the outside world and you want that interaction to become
  predictable in tests.
- Avoid wrapping pure in-process logic; test that directly.
- Make fixture names describe the behavior under test, not incidental
  implementation details.
- Review fixture changes like snapshots: small intentional diffs are useful,
  broad churn is suspicious, and hand-edited fixture contents should be rare.
