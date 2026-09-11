# comline

<a aria-label="NPM version" href="https://www.npmjs.com/package/comline">
	<img
		alt="NPM Version"
		src="https://img.shields.io/npm/v/comline?style=for-the-badge"
	>
</a>
<a aria-label="Dependencies 2" href="https://www.npmjs.com/package/comline">
	<img
		alt="Dependencies 2"
		src="https://img.shields.io/badge/dependencies-2-0?style=for-the-badge"
	>
</a>
<a aria-label="Coverage" href="https://recoverage.cloud/">
	<img
		alt="Coverage"
		src="https://img.shields.io/endpoint?url=https%3A%2F%2Frecoverage.cloud%2Fshields%2FS1ikz1yFmk93qbAI7lLnu%2Fcomline"
	>
</a>

```sh
bun i comline
```

comline makes it easy to turn a TypeScript function into a command line
tool.

## usage

let's say we have the following function defined in `greet.ts`:

```typescript
/**
 * @param {string} name
 * @param {number} age
 * @returns {string}
 */
function greet(name: string, age: number): string {
	return `Hello, ${name}!`
}
```

create a `greet.x.ts` file with the following contents:

```typescript
import * as path from "node:path"

import { cli, options, parseNumberOption, parseStringOption } from "comline"
import { z } from "zod/v4"

import { greet } from "./greet"

const greetCli = cli({
	cliName: "greet",
	discoverConfigPath: () => path.join(process.cwd(), `.greet-config.json`),
	routeOptions: {
		"": options(
			`greet someone`,
			z.object({
				name: z.string(),
				age: z.number(),
			}),
			{
				name: {
					description: `name`,
					example: `--name=jeremybanka`,
					flag: `n`,
					parse: parseStringOption,
					required: true,
				},
				age: {
					description: `age`,
					example: `--age=1`,
					flag: `a`,
					parse: parseNumberOption,
					required: true,
				},
			},
		),
	},
})

const {
	inputs: {
		opts: { name, age },
	},
} = greetCli(process.argv)

const output = greet(name, age)
process.stdout.write(output)
```

then, run the file `greet.x.ts` with the following command:

```sh
bun greet.x.ts --name=jeremybanka --age=1
```

this will print `Hello, jeremybanka!`

`cli()` is configured with `routeOptions`. The root route is the empty string
`""`; named positional routes use slash-delimited route names like
`"hello/world"`.

Use `options(description, schema, optionConfigs)` to attach a schema and parser
configuration to a route. The schema may be a Zod schema or an Arktype type.
Routes without options may use `null` or `noOptions(description)`.

Calling a configured CLI returns:

- `inputs.case`: the matched route key, such as `""` or `"hello/$name"`
- `inputs.path`: the positional argument path supplied by the user
- `inputs.opts`: parsed and schema-validated options for that route
- `writeJsonSchema(outdir)`: writes JSON Schema files for each route with
  options

```typescript
const { inputs, writeJsonSchema } = greetCli(process.argv)

if (process.env.WRITE_CONFIG_SCHEMA) {
	writeJsonSchema(`./schemas`)
}

greet(inputs.opts.name, inputs.opts.age)
```

## features

- [x] switches (`--age`)
  - `""` will be provided to the option parser for `age` in this case
- [x] switches with values (`--age=1`, `--age 1`)
  - `"1"` will be provided to the option parser for `age` in this case
- [x] multiple instances of the same switch (`--age=1 --age 2`)
  - `"1,2"` will be provided to the option parser for `age` in this case
- [x] flags (`-a`)
  - `""` will be provided to the option parser for `age` in this case
- [x] multiple instances of the same flag (`-aa`)
  - `","` will be provided to the option parser for `age` in this case
- [x] flags with values (`-a=1`, `-a 1`)
  - `"1"` will be provided to the option parser for `age` in this case
- [ ] JSON Schema composition in value-consuming option heuristics
  - recognize boolean-like option schemas through wrappers like `anyOf`, `oneOf`,
    and `allOf`
  - for example, a CLI author could model a nullable boolean option as
    `z.boolean().nullable().optional()` and still have `my-cli --dry-run start`
    treat `--dry-run` as a bare boolean switch instead of consuming `start`
- [x] combined flags (`-na`)
  - `""` will be provided to the option parser for `name` in this case
  - `""` will be provided to the option parser for `age` in this case
- [x] positional arguments (`my-cli -- positional`)

  - validated as a "route" into the tree of positional arguments

  ```typescript
  import type { Tree, TreePath } from "comline"
  import { optional, required } from "comline"

  const myTree = required({
  	hello: optional({
  		world: null,
  		$name: optional({
  			good: required({
  				morning: null,
  			}),
  		}),
  	}),
  }) satisfies Tree

  const validPaths: TreePath<typeof myTree>[] = [
  	[`hello`],
  	[`hello`, `world`],
  	[`hello`, `jeremybanka`],
  	[`hello`, `jeremybanka`, `good`, `morning`],
  ]
  ```

  route options are keyed by the route path:

  ```typescript
  const myCli = cli({
  	cliName: `my-cli`,
  	routes: myTree,
  	routeOptions: {
  		hello: null,
  		"hello/world": null,
  		"hello/$name": null,
  		"hello/$name/good/morning": null,
  	},
  })
  ```

## option parsers

comline exports these parser helpers:

- `parseStringOption`: returns the raw option value
- `parseNumberOption`: parses a number; blank switches parse as `1`, and
  repeated bare flags like `-aaa` parse as the repeat count
- `parseBooleanOption`: treats `false` and `0` as `false`, and other values as
  `true`
- `parseArrayOption`: splits the option value on spaces

## limitations

- flags are supported, but they must be single characters, either uppercase or lowercase.

## argument input

Pass the full runtime argv to a configured CLI:

```typescript
const { inputs } = greetCli(process.argv)
```

Comline follows the Node/Bun argv convention: the first two entries identify the
runtime and entry point; parsing starts with the following command words. This
also applies to global commands, shebang scripts, and commands launched through
`pnpm exec` or `mise exec`. Launchers do not appear as extra prefixes in the
child's `process.argv`. No runtime or executable names are inspected.

This follows [Commander's argv contract](https://github.com/tj/commander.js/blob/master/Readme.md#parse-and-parseasync)
and [Node's documented argv layout](https://nodejs.org/api/process.html#processargv).
`cliName` is a display name, so matching words remain positional arguments.

A `--` delivered to Comline ends option parsing. For example,
`mise exec -- pnpm exec mycli -- foo` delivers `[runtime, entryPoint, "--", "foo"]`:
mise consumes its delimiter, while the delimiter after `mycli` remains part of
the CLI input. Routes may appear before `--`, and subsequent words are literal
positionals.

Migration: keep `myCli(process.argv)` as-is. The parser always accepts full runtime
argv; command-only or executable-only arrays are no longer inferred.

## Coverage

Run `pnpm --filter comline test:coverage:once` to generate V8 coverage for `src/**/*.ts`. Reports are written to `packages/comline/coverage` in text, LCOV, and Istanbul JSON formats; `coverage-final.json` is the input to recoverage.

Run `pnpm --filter comline test:coverage` to generate coverage and compare it with the main-branch baseline. The repository's Coverage CI job runs the same comparison through `pnpm test:coverage:increased`, using `RECOVERAGE_CLOUD_TOKEN` to retrieve and publish baselines. Recoverage publishes the comline baseline on main and rejects statement-coverage decreases on pull requests. The first main-branch coverage run establishes the cloud baseline; local comparisons require a captured main-branch report or access to that cloud baseline.

## completion API

`cli()` exposes `interpret(request)` and asynchronous `complete(request)` methods. Both use the same option consumption and route traversal as normal invocation. Interpretation tolerates missing required options and unfinished routes; it does not discover configuration, call option parsers, validate schemas, or execute commands. Only `complete()` invokes explicitly configured candidate providers.

```typescript
import { cli, options, required } from "comline"
import { z } from "zod"

const prOptions = options(
	"pull requests",
	z.object({
		state: z.enum(["open", "closed", "all"]).optional(),
		base: z.string().optional(),
		input: z.string().optional(),
	}),
	{
		state: {
			description: "PR state",
			example: "--state=open",
			flag: "s",
			required: false,
		},
		base: {
			description: "base branch",
			example: "--base=main",
			required: false,
			completion: {
				// A provider can instead return a Promise and query local Git refs.
				provide: () => [{ value: "main", description: "default branch" }],
			},
		},
		input: {
			description: "input file",
			example: "--input=body.json",
			required: false,
			completion: { fileSystem: "files" },
		},
	},
)

const prCli = cli({
	cliName: "fj",
	routes: required({ pr: required({ list: null, create: null }) }),
	routeOptions: { "pr/list": prOptions, "pr/create": prOptions },
})

const result = await prCli.complete({ words: ["pr", "list", "--state=cl"] })
// result.candidates: [{ value: "closed" }]
// result.context.prefix: "cl"
// result.context.replacement: { word: 2, start: 8, end: 10 }

const context = prCli.interpret({ words: ["pr", "create", "--base", ""] })
// context.route: "pr/create"
// context.targets[0]: { kind: "option-value", option: { key: "base", ... } }
```

Requests contain shell-tokenized, unescaped `words` **without the executable or runtime arguments**. The last word is being edited; include an empty final word for a trailing space. `words: []` is equivalent to `[""]`. An optional `cursor: { word, offset }` supports editing an earlier word or inside a word. Offsets count UTF-16 code units. Later words do not affect completion.

Candidate values replace `context.replacement.start` through `.end` in the specified word. The range covers the entire current word (including any suffix after the cursor), or just its value for an inline assignment. Thus completing `--state=clutter` with the cursor after `cl` replaces `clutter` with `closed` and retains `--state=`. Adapters must map these unescaped ranges back to shell syntax, quote candidate values, and translate file/spacing hints into shell directives.

Context includes the canonical `route`, actual positional `path`, remaining `tree`, and a `complete` flag indicating whether the required route is satisfied. `options` retains raw occurrences with canonical keys, token indexes, values, and indexes of separately consumed values. Repeated values remain separate; grouped counting flags retain Comline's comma representation. For incomplete routes, options through following variable positionals are available too. `allOptions` and `allOccurrences` expose the possible interpretations across routes, including options supplied before command selection; they may contain multiple interpretations when routes reuse an option with different semantics. `suppliedOptions` identifies options with occurrences under their own consumption rules across possible routes. `reachableOptions` supplies early option-name suggestions and restricts value-completion fallback to the selected route and its descendants, so providers on unreachable sibling routes are not invoked. `targets` can contain both a boolean value and a positional/command target.

For adapters that only need to interpret already completed words, use `interpretArguments(definition, words)`. Unlike `interpret()` and `interpretCompletion(definition, request)`, this treats every supplied word as completed. `complete(definition, request)` is also available as a standalone function. None of these APIs require calling normal invocation first.

Option configurations accept:

- `aliases`: additional long names without `--`, shared by execution and completion. The option's object key remains its canonical name.
- `valueKind: "boolean" | "value"`: overrides schema-based consumption in both paths, including schemas whose boolean type is hidden by composition.
- `completion.choices`: strings or `{ value, description?, appendSpace? }` candidates. Overrides inferred primitive `enum`/`const` choices; booleans otherwise offer `true`, `false`, `0`, and `1`.
- `completion.fileSystem`: `"none"`, `"files"`, or `"directories"` requests shell filesystem completion. Comline itself does not read directories.
- `completion.appendSpace`: default spacing behavior; candidates may override it.
- `completion.repeatable: false`: hides a supplied option from suggestions using that option's own names and value-consumption rules, including before an optional positional is supplied. Defaults to allowing repetition, including scalar options and counting flags.
- `completion.provide(context)`: supplies additional candidates synchronously or asynchronously. Receives the context, the specific `target`, and the optional request `signal`. Providers should respect cancellation; Comline discards results after cancellation and returns provider failures in `diagnostics`.

Use `definition.positionalCompletions` for the same hints on variable positions, keyed by the full variable route name, such as `"commit/view/$ref"`. Literal command suggestions and variable candidates can coexist. Missing schema metadata falls back to explicit hints and value-consuming options; no option parser is called to infer completion behavior. JSON Schema metadata is read once per shared schema per interpretation.

When several targets are possible, filesystem hints combine as a union: `files` takes precedence over `directories`, which takes precedence over `none`. The result's `appendSpace` is false if any target requests no trailing space. Candidates retain their own target's spacing behavior through a candidate-level override when necessary, so a positional hint cannot suppress spacing on a literal command. For duplicate candidate values, a no-space request takes precedence. These rules do not depend on route declaration order.

Before an optional variable positional is supplied, the current route and its variable descendants retain distinct option aliases, choices, and providers. Normal execution selects only the final route's option group. Raw occurrences are shared when token-consumption rules match, independently of completion metadata.

Equivalent options with cloned hint objects share a completion target when their option metadata, effective choices and hints, and provider function match. Distinct provider functions remain separate, even when their other hints match.

The first committed `--` ends option interpretation. An unfinished `--` remains an option-name prefix until the shell starts the next word. Existing Comline rules also apply to short groups, repeated options, boolean literals, and negative or otherwise unrecognized dash-prefixed values. In particular, an inline value on a short group applies to every flag in the group: `-dc=0` supplies `"0"` to both `d` and `c`. Completion preserves this existing parsing rule, including before command selection.

## shell integrations

Opt in to completion commands at your executable's entry point, before normal parsing or application initialization:

```typescript
import { cli, completionResponse } from "comline"

const parse = cli(definition)
const completion = await completionResponse(definition, process.argv)
if (completion !== undefined) {
	process.stdout.write(completion)
} else {
	const { inputs } = parse(process.argv)
	await execute(inputs)
}
```

`completionResponse` accepts full runtime argv, like normal parsing. It returns the completion response as a string, or `undefined` for ordinary invocation. It does not write output, exit the process, parse option values, validate schemas, or discover application configuration. The explicit `completion install` invocation queries shell startup settings and writes a completion file; candidate requests and script generation do neither. Providers explicitly configured for completion may run. Dispatch before other application startup code to keep stdout clean and avoid running commands during completion.

Opting in reserves `completion <target>`, `completion install <bash|zsh|fish|nushell|carapace>`, `__complete`, `__completeNoDesc`, `_carapace export`, `_comline complete`, and `_comline nushell`. The `completion` command prints a setup artifact for `bash`, `zsh`, `fish`, `nushell`, or `carapace`. The hidden commands answer candidate requests. `completionScript(cliName, target)` also generates the artifact directly, without an invocation. Command names must contain only letters, digits, periods, underscores, or hyphens and begin with a letter or digit.

The same generated integration works with an executable installed globally by a package manager or produced by `bun build --compile`: it calls the command on `PATH`. Generating an artifact does not install or discover it automatically.

Install completions explicitly:

```sh
mycli completion install bash
mycli completion install zsh
mycli completion install fish
mycli completion install nushell
mycli completion install carapace
```

`installCompletion(cliName, target)` exposes the same operation as an async library helper and returns the installed file's absolute path. Shell installation starts the selected shell interactively to read its configured search paths, including unexported settings. This executes the shell's normal startup files with a ten-second timeout; it never edits them. Carapace installation queries `carapace --help` for its effective specs directory. An unavailable executable, missing completion initialization, insecure Zsh search directories, or an unavailable writable destination produces an actionable error. Install only the integrations you use; for a shell already connected to Carapace, choose the Carapace target alone.

| Target   | Dependency and destination                                                                                                                                                                                                                              |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bash     | Requires Bash 4+ with `bash-completion` enabled. Writes `mycli.bash` under a user directory from `BASH_COMPLETION_USER_DIR`, falling back to `$XDG_DATA_HOME/bash-completion/completions` or `~/.local/share/bash-completion/completions`.              |
| Zsh      | Requires Zsh's built-in completion system initialized with `compinit`. Writes `_mycli` into a writable, secure directory already on the configured `$fpath`. No arbitrary directory is added to the search path.                                        |
| Fish     | Requires Fish. Writes `mycli.fish` into the user vendor directory (`$XDG_DATA_HOME/fish/vendor_completions.d`, normally `~/.local/share/fish/vendor_completions.d`) only if it is present in `$fish_complete_path`.                                     |
| Nushell  | Requires Nu with external completions enabled. Writes `mycli.nu` under `($nu.data-dir)/vendor/autoload`, confirmed against `$nu.vendor-autoload-dirs`. Preserves the existing external completer for other commands; requires no Carapace installation. |
| Carapace | Requires the `carapace` executable. Writes `mycli.yaml` in its reported specs directory. The user must already have connected Carapace to their shell; installation does not configure that shared integration and requires no particular shell.        |

Installation creates a recognized missing directory, atomically replaces this CLI's regular completion file, and reports its path. It refuses non-regular destinations and files that would be hidden by a higher-priority override. Nushell executes all autoload files, so installation also rejects a same-named registration in another vendor or user autoload directory. It does not request elevated privileges or edit shell profiles. If Bash completion or Zsh's `compinit` is not enabled, the user must enable that shared shell facility themselves. Open a new shell after installation; Zsh configurations that deliberately reuse a stale completion dump may require the user to refresh that cache.

`mycli completion <target>` continues to print the full standalone artifact for manual or distribution-package installation. Generated files contain no managed-block delimiters; Zsh retains its required first-line `#compdef mycli`. Updating the CLI's completion file uses the same install command; removing it means deleting the reported file. Candidates are obtained dynamically from the CLI on PATH, while adapter changes require reinstalling the file.

Bash, Zsh, Fish, and Nushell adapters are maintained as readable files in `src/shells` and embedded as text during the package build or Bun compilation. They require no script generator or runtime file loading. The Bash, Zsh, and Fish adapters request `_comline complete`, which adds an engine-derived literal replacement prefix to the candidate lines and directives. This preserves positional words containing `=` after `--` and dash-prefixed option values without reconstructing assignment semantics in each shell. The standard Cobra endpoints retain their original wire format. Comline implements Cobra's candidate lines, tab-separated descriptions, and final directive bitmask, including the no-description endpoint. Carapace uses its native JSON export protocol. Nushell's native integration does not require Carapace. Adapters for JSON consumers perform filesystem discovery when requested; the core `complete()` API continues to return filesystem hints without reading directories.

Cobra cannot represent tabs or line breaks in a candidate value, so those values are omitted from that transport. Descriptions are normalized to one line. Cobra spacing directives apply to the entire result; Carapace uses suffix-based spacing. Both adapters conservatively suppress an appended space when any returned candidate requires more input. The native Nushell adapter retains individual spacing choices. Fish's completion API does not expose an arbitrary no-space flag: the adapter preserves the exact candidate set and uses Fish's native spacing rules, so a plain candidate such as `plain` receives a trailing space even when its provider requests `appendSpace: false`. Punctuation such as a trailing slash still suppresses spacing naturally. Shell integrations inherit their consumer's tokenization and cursor behavior; `complete({ words, cursor })` remains available for adapters needing the full replacement-range contract.

Shell adapters remove lexical quoting without evaluating command substitutions. Balanced quoted words, quoted or empty earlier arguments, and editing an earlier word are covered by real-shell tests. Unfinished quotes, shell expansions, and replacement of an existing suffix after the cursor within a word are not part of the tested contract. Bash inserts candidate values; Zsh and Fish also display their descriptions. Carapace 1.6.3's Cobra bridge also drops inline option-value candidates such as `--state=cl`, including with upstream Cobra; use the generated native Carapace integration, which handles inline values correctly. The separate upstream Cobra suite verifies that limitation against a real Cobra executable instead of changing the Cobra wire format to accommodate it.

Nushell loads the installed file at interactive startup. The file registers a handler for this CLI and delegates other commands to the previous external completer, including Carapace or another CLI's handler. It does not invoke the CLI until a completion is requested, and it respects the user's external-completion enable setting. User autoload files run after vendor files and can intentionally replace the provider. No `config.nu` edits or `source` statements are needed. Carapace's spec delegates to the CLI's native JSON export protocol and works with the user's existing Carapace shell integration; installing both targets is unnecessary for Nu users already using Carapace.

### compatibility tests

Bash supports single- or double-quoted executable names after its completion file has loaded. Bash's completion lookup and bash-completion's lazy loader use the literal command spelling, so first trigger completion once with the unquoted command name in a new shell. The adapter decodes quoting without evaluating shell expressions.

Shell and upstream Cobra compatibility tests run in comline's standard Vitest suite through `pnpm test`, or `pnpm exec turbo run test:once --filter=comline`. Have Bash, bash-completion, Zsh, Fish, Nushell, Carapace, Node, npm, Bun, and Go available; missing tools fail rather than silently skipping coverage. Turbo builds workspace dependencies first. Set `BASH_COMPLETION_FILE` if bash-completion is not at `/usr/share/bash-completion/bash_completion`. To run only the shell tests after building dependencies, use `pnpm --filter comline exec vitest run __tests__/completion-shells.test.ts`; that subset does not require Go.

CI includes the installed consumer and Go versions, OS, architecture, and bash-completion file checksum in `COMLINE_TEST_ENV`, which participates in comline's normal test cache key alongside source, fixtures (including `go.mod` and `go.sum`), build configuration, and tool configuration. Local direct Vitest runs bypass Turbo's cache; use those or Turbo's `--force` option after changing locally installed consumers unless you also update `COMLINE_TEST_ENV`.

The suite installs a fixture through npm's global installation mechanism and also builds it as a Bun executable. All five targets are installed through their public install command. Bash, Zsh, Fish, and Nushell discover their files through native search paths or vendor autoload; Carapace discovers its installed spec independently of the native Nu handler. The tests check replacement, unchanged shell profiles, missing dependencies, unwritable destinations, custom search paths, user overrides, and coexistence with existing Nushell and Carapace providers. A TypeScript driver uses Bun's terminal API to drive the real shells through pseudo-terminals, press Tab, execute the resulting command, and verify parsed arguments. It also exercises Carapace's native and Cobra bridges. Edit the shell files directly; the build embeds their contents without generating another checked-in source file.

The Cobra tests build the small reference executable in `__tests__/fixtures/cobra` into a temporary directory and compare protocol responses for descriptions, inline values, spacing, and filesystem directives. They also reproduce the Carapace Cobra-bridge limitation. Go produces only the temporary test executable; it contributes no shipped code. An empty Go module cache requires downloading the pinned dependencies. To run only these tests after building workspace dependencies, use `pnpm --filter comline exec vitest run __tests__/completion-cobra.test.ts`.
