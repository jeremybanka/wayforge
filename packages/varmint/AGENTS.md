# varmint

## Purpose

Varmint wraps slow, expensive, flaky, or external asynchronous work in
filesystem-backed fixtures so tests can run deterministically without calling
the real dependency every time.

Varmint is a deterministic function-call replay tool, not a general snapshot
directory. Its fixtures are useful when they document the real interaction you
would otherwise have repeated.

## High-signal checklist

- Wrap the exact external boundary.
- Record explicit, safe semantic inputs rather than upstream application state.
- Remember that closure configuration is invisible to Varmint.
- Use readable fixture names plus a complete-contract fingerprint when a label
  alone is not enough identity.
- Use strict `read` by default and explicit `write` recording commands.
- Cache raw dependency output; validate, guard, retry, and fall back outside the
  cache.
- Distinguish raw output, fallback decisions, and committed actions when that
  difference matters.
- Track the fixtures CI needs and ignore transient analysis.
- Verify real-call provenance instead of inferring it from scenario names.
- Never record secrets.
- Never flush shared or partially enumerated fixture collections.
- Isolate concurrent writers.

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
- `.input.json` contains the wrapped function's positional argument list. A
  one-argument function records `[value]`, not `value`; avoid adding wrapper
  objects solely to make fixture formatting prettier.
- Avoid manually editing fixtures in normal use. Their job is to document and
  cache real calls, so regenerate them from the wrapped interaction when the
  underlying behavior changes.

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

export const VARMINT_MODE: CacheMode =
	process.env[`NODE_ENV`] === `production`
		? `off`
		: process.env[`RECORD_FIXTURES`] === `1`
			? `write`
			: `read`
```

- Use `read` for ordinary local tests and CI so fixture misses are visible
  failures.
- Use `write` only through an explicit fixture-maintenance command, such as
  `RECORD_FIXTURES=1`.
- Use `off` in production builds, runtime code, or deliberate uncached
  exploration so Varmint never records or replays test fixtures there.
- Use `read-write` only when silent live calls are cheap, side-effect-free, and
  acceptable.

For cheap disposable integrations, this looser policy can be convenient:

```ts
export const VARMINT_MODE: CacheMode = process.env[`CI`]
	? `read`
	: process.env[`NODE_ENV`] === `production`
		? `off`
		: `read-write`
```

Avoid the looser policy for paid, rate-limited, side-effecting, or
provenance-sensitive dependencies. A cache miss in `read-write` mode silently
makes a live call, and a single test run can mix old cached results with newly
recorded behavior.

## Fixture identity

Varmint can only compare explicit call arguments. Configuration captured by a
closure is invisible to it. If hidden configuration can change the result,
either make a safe representation of it an explicit argument or include a
deterministic fingerprint of the complete semantic contract in the fixture
identity. Never include credentials or secrets in that fingerprint.

For model calls, the semantic contract usually includes the model, rendered
prompt, system instructions, structured-output contract, provider settings,
endpoint or API version, and any prompt-template or parser version that changes
the meaning of the result.

Readable labels are good navigation aids, but they are weak identities. Prefer a
readable behavioral prefix followed by a deterministic fingerprint when the same
label might describe multiple contracts:

```text
round-2-trick-4-play-3-P1--a701b47efab7
```

The prefix explains the scenario; the suffix helps contract changes produce
visibly distinct cases. Remember that filename sanitization can collapse
otherwise distinct names, so do not rely on human-readable text alone for
collision-sensitive cases.

## Boundary selection

Record the stable value that actually crosses the external boundary, not an
upstream application object that will later be transformed into that value.

```ts
// Poor: records a large internal object, not the dependency-facing input.
cachedGenerateTurn(gameState)

// Better: records the actual value sent to the dependency.
cachedModelCall(renderPrompt(gameState))
```

If fixture diffs are unexpectedly large, dominated by internal state, or
difficult to interpret, the wrapper is probably too high in the stack. For model
calls, the usual reviewable input is the rendered prompt or a compact, safe
representation of the outbound generation request.

## Basic workflow

- Wrap the boundary you want to stabilize with
  `new Squirrel(mode).add(key, fn)` or
  `new Ferret(mode).add(key, streamFn)`.
- In ordinary local and CI test runs, use `read` so tests prove all external
  behavior is represented by committed fixtures.
- When behavior intentionally changes, run an explicit recording command in
  `write` mode or delete the affected fixture and rerun that recording command.
- Commit the updated `.varmint` fixture files with the test change so future runs
  replay the same behavior.
- If CI uses `read`, verify that every required fixture is tracked rather than
  merely present locally. Inspect ignore rules, staged fixture counts, and final
  committed paths.
- Keep durable replay evidence, including inputs and outputs, tracked. Keep
  transient reports, costs, timestamps, assessments, and local diagnostic
  artifacts ignored unless the project explicitly treats them as golden data.
- Persist sufficient recording diagnostics before enforcing quality assertions
  such as zero fallbacks. Fixture validity and dependency quality are separate
  questions.

## Raw output and guards

Prefer caching the raw external result, then run parsing, validation, legality
checks, retries, and fallbacks outside the cache. Replay should exercise the
application's handling of malformed or invalid dependency behavior, not only the
happy path.

Do not assume that a cached output was accepted by the application. When the
distinction matters, assert the raw result, guarded decision, and committed
action separately. Invalid outputs are often especially useful regression cases,
so do not manually sanitize a fixture just because the external result is poor.

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
- Use Varmint anywhere your code has an unpredictable interaction with the
  outside world and you want that interaction to become predictable in tests.
- Prefer seeded randomness, injected clocks, and deterministic identifiers when
  the nondeterminism is owned by the application. Use Varmint for random values,
  dates, clocks, or Temporal values when they genuinely cross an external or
  otherwise difficult-to-control boundary.
- Avoid wrapping pure in-process logic; test that directly.
- Make fixture names describe the behavior under test, not incidental
  implementation details.
- Review fixture changes like snapshots: small intentional diffs are useful,
  broad churn is suspicious, and hand-edited fixture contents should be rare.
- Never pass credentials, authorization headers, secrets, or unnecessary private
  data through recorded arguments. Define a safe fixture boundary and inspect
  generated files before staging them.
- Scenario labels describe intended provenance; they do not prove that an
  external call occurred. Recording tests should separately count live calls,
  cache hits, fallbacks, and committed actions when provenance matters.
- Concurrent writers must not share a mutable fixture directory. Give parallel
  agents and test processes isolated cache roots unless the shared collection is
  intentionally read-only. Run deliberate recording jobs alone.
- Use `flush` only when the current run authoritatively enumerates the entire
  fixture collection, uses an isolated writable directory, and is not a filtered
  or concurrent test run. Never flush a shared collection from a partial test
  selection.
