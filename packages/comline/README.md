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

Context includes the canonical `route`, actual positional `path`, remaining `tree`, and a `complete` flag indicating whether the required route is satisfied. `options` retains raw occurrences with canonical keys, token indexes, values, and indexes of separately consumed values. Repeated values remain separate; grouped counting flags retain Comline's comma representation. For incomplete routes, options through following variable positionals are available too. `allOptions` and `allOccurrences` expose the possible interpretations across routes, including options supplied before command selection; they may contain multiple interpretations when routes reuse an option with different semantics. `targets` can contain both a boolean value and a positional/command target.

For adapters that only need to interpret already completed words, use `interpretArguments(definition, words)`. Unlike `interpret()` and `interpretCompletion(definition, request)`, this treats every supplied word as completed. `complete(definition, request)` is also available as a standalone function. None of these APIs require calling normal invocation first.

Option configurations accept:

- `aliases`: additional long names without `--`, shared by execution and completion. The option's object key remains its canonical name.
- `valueKind: "boolean" | "value"`: overrides schema-based consumption in both paths, including schemas whose boolean type is hidden by composition.
- `completion.choices`: strings or `{ value, description?, appendSpace? }` candidates. Overrides inferred primitive `enum`/`const` choices; booleans otherwise offer `true`, `false`, `0`, and `1`.
- `completion.fileSystem`: `"none"`, `"files"`, or `"directories"` requests shell filesystem completion. Comline itself does not read directories.
- `completion.appendSpace`: default spacing behavior; candidates may override it.
- `completion.repeatable: false`: hides a supplied option from suggestions. Defaults to allowing repetition, including scalar options and counting flags.
- `completion.provide(context)`: supplies additional candidates synchronously or asynchronously. Receives the context, the specific `target`, and the optional request `signal`. Providers should respect cancellation; Comline discards results after cancellation and returns provider failures in `diagnostics`.

Use `definition.positionalCompletions` for the same hints on variable positions, keyed by the full variable route name, such as `"commit/view/$ref"`. Literal command suggestions and variable candidates can coexist. Missing schema metadata falls back to explicit hints and value-consuming options; no option parser is called to infer completion behavior. JSON Schema metadata is read once per shared schema per interpretation.

When several targets are possible, filesystem hints combine as a union: `files` takes precedence over `directories`, which takes precedence over `none`. The result's `appendSpace` is false if any target requests no trailing space. Candidates retain their own target's spacing behavior through a candidate-level override when necessary, so a positional hint cannot suppress spacing on a literal command. For duplicate candidate values, a no-space request takes precedence. These rules do not depend on route declaration order.

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

`completionResponse` accepts full runtime argv, like normal parsing. It returns the completion response as a string, or `undefined` for ordinary invocation. It does not write output, exit the process, parse option values, validate schemas, or discover configuration. Providers explicitly configured for completion may run. Dispatch before other application startup code to keep stdout clean and avoid running commands during completion.

Opting in reserves `completion <target>`, `__complete`, `__completeNoDesc`, `_carapace export`, and `_comline nushell`. The `completion` command prints a setup artifact for `bash`, `zsh`, `fish`, `nushell`, or `carapace`. The hidden commands answer candidate requests. `completionScript(cliName, target)` also generates the artifact directly, without an invocation. Command names must contain only letters, digits, periods, underscores, or hyphens and begin with a letter or digit.

The same generated integration works with an executable installed globally by a package manager or produced by `bun build --compile`: it calls the command on `PATH`. Generating an artifact does not install or discover it automatically.

| Target   | Setup                                                                                                                                                                                         |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bash     | Load the `bash-completion` package, then `source <(mycli completion bash)`. Persist by sourcing a generated file or including the generated block in `.bashrc`.                               |
| Zsh      | Initialize completion with `autoload -Uz compinit; compinit`, then `source <(mycli completion zsh)`. Alternatively save the script as `_mycli` in a directory on `$fpath` before `compinit`.  |
| Fish     | `mycli completion fish \| source`; persist the generated script at `$__fish_config_dir/completions/mycli.fish`.                                                                               |
| Nushell  | Save `mycli completion nushell` to a `.nu` file and `source` it from `config.nu`. Its external completer delegates other commands to the previously configured completer, including Carapace. |
| Carapace | Save `mycli completion carapace` as `mycli.yaml` in Carapace's specs directory (shown by `carapace --help`). Existing shell integration with Carapace then handles it.                        |

Bash, Zsh, and Fish scripts come from the pinned upstream Cobra generator. Comline implements Cobra's candidate lines, tab-separated descriptions, and final directive bitmask, including the no-description endpoint. Carapace uses its native JSON export protocol. Nushell's native integration does not require Carapace. Adapters for JSON consumers perform filesystem discovery when requested; the core `complete()` API continues to return filesystem hints without reading directories.

Cobra cannot represent tabs or line breaks in a candidate value, so those values are omitted from that transport. Descriptions are normalized to one line. Cobra spacing directives apply to the entire result; Carapace uses suffix-based spacing. Both adapters conservatively suppress an appended space when any returned candidate requires more input. The native Nushell adapter retains individual spacing choices. Shell integrations inherit their consumer's tokenization and cursor behavior; `complete({ words, cursor })` remains available for adapters needing the full replacement-range contract.

The upstream shell scripts do not reliably complete an unfinished quoted token or replace an existing suffix after the cursor within a word. Completing a balanced quoted word and editing an earlier word are covered by the real-shell tests. Fish's adapter normalizes quoted prefixes before requesting and filtering candidates. Carapace 1.6.3's Cobra bridge also drops inline option-value candidates such as `--state=cl`, including with upstream Cobra; use the generated native Carapace integration, which handles inline values correctly. The compatibility suite verifies that limitation against a real Cobra executable instead of changing the Cobra wire format to accommodate it.

### managed setup blocks

Generated artifacts include command- and target-specific comment delimiters:

```bash
# >>> comline completion:mycli:bash >>>
# generated integration
# <<< comline completion:mycli:bash <<<
```

`updateCompletionSetup(existingText, cliName, target)` replaces matching blocks or appends one when absent. It removes duplicate matching blocks, recognizes delimiters after indentation or whitespace changes, and preserves text outside the blocks. The helper preserves CRLF line endings when the existing file uses them. Zsh's required first-line `#compdef` header travels with its adjacent block. `removeCompletionSetup(existingText, cliName, target)` removes the same managed region. Both reject unmatched or nested matching delimiters instead of guessing where user configuration ends. These helpers return text; the caller chooses the file and writes it.

```typescript
import { readFile, writeFile } from "node:fs/promises"
import { updateCompletionSetup } from "comline"

const existing = await readFile(profilePath, "utf8")
const updated = updateCompletionSetup(existing, "mycli", "bash")
await writeFile(profilePath, updated)
```

### compatibility tests

Run `pnpm --filter comline test:completions` with Bash, bash-completion, Zsh, Fish, Nushell, Carapace, Go, Node, npm, and Bun available. Set `BASH_COMPLETION_FILE` if bash-completion is not at `/usr/share/bash-completion/bash_completion`. The dedicated CI job installs the consumers and runs this suite; missing tools fail rather than silently skipping coverage.

The suite installs a fixture through npm's global installation mechanism and also builds it as a Bun executable. A TypeScript driver uses Bun's terminal API to drive the real shells through pseudo-terminals, press Tab, execute the resulting command, and verify parsed arguments. It also exercises Carapace's native and Cobra bridges, checks responses against an upstream Cobra program, and verifies that the vendored scripts still match their generator. Regenerate scripts from `scripts/completions` with `go run . > ../../src/completion-scripts.gen.ts`.
