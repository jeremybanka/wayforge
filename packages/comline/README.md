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

`cli()` exposes `interpret(request)` and asynchronous `complete(request)` methods.
Both use the same option consumption and route traversal as normal invocation.
Interpretation tolerates missing required options and unfinished routes; it does
not discover configuration, call option parsers, validate schemas, or execute
commands. Only `complete()` invokes explicitly configured candidate providers.

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

Requests contain shell-tokenized, unescaped `words` **without the executable or
runtime arguments**. The last word is being edited; include an empty final word
for a trailing space. `words: []` is equivalent to `[""]`. An optional
`cursor: { word, offset }` supports editing an earlier word or inside a word.
Offsets count UTF-16 code units. Later words do not affect completion.

Candidate values replace `context.replacement.start` through `.end` in the
specified word. The range covers the entire current word (including any suffix
after the cursor), or just its value for an inline assignment. Thus completing
`--state=clutter` with the cursor after `cl` replaces `clutter` with `closed` and
retains `--state=`. Adapters must map these unescaped ranges back to shell syntax,
quote candidate values, and translate file/spacing hints into shell directives.

Context includes the canonical `route`, actual positional `path`, remaining
`tree`, and a `complete` flag indicating whether the required route is satisfied.
`options` retains raw occurrences with canonical keys, token indexes, values,
and indexes of separately consumed values. Repeated values remain separate;
grouped counting flags retain Comline's comma representation. For incomplete
routes, options through following variable positionals are available too.
`allOptions` and `allOccurrences` expose the possible interpretations across
routes, including options supplied before command selection; they may contain
multiple interpretations when routes reuse an option with different semantics.
`targets` can contain both a boolean value and a positional/command target.

For adapters that only need to interpret already completed words, use
`interpretArguments(definition, words)`. Unlike `interpret()` and
`interpretCompletion(definition, request)`, this treats every supplied word as
completed. `complete(definition, request)` is also available as a standalone
function. None of these APIs require calling normal invocation first.

Option configurations accept:

- `aliases`: additional long names without `--`, shared by execution and
  completion. The option's object key remains its canonical name.
- `valueKind: "boolean" | "value"`: overrides schema-based consumption in both
  paths, including schemas whose boolean type is hidden by composition.
- `completion.choices`: strings or `{ value, description?, appendSpace? }`
  candidates. Overrides inferred primitive `enum`/`const` choices; booleans
  otherwise offer `true`, `false`, `0`, and `1`.
- `completion.fileSystem`: `"none"`, `"files"`, or `"directories"` requests shell
  filesystem completion. Comline itself does not read directories.
- `completion.appendSpace`: default spacing behavior; candidates may override it.
- `completion.repeatable: false`: hides a supplied option from suggestions.
  Defaults to allowing repetition, including scalar options and counting flags.
- `completion.provide(context)`: supplies additional candidates synchronously or
  asynchronously. Receives the context, the specific `target`, and the optional
  request `signal`. Providers should respect cancellation; Comline discards
  results after cancellation and returns provider failures in `diagnostics`.

Use `definition.positionalCompletions` for the same hints on variable positions,
keyed by the full variable route name, such as `"commit/view/$ref"`. Literal
command suggestions and variable candidates can coexist. Missing schema metadata
falls back to explicit hints and value-consuming options; no option parser is
called to infer completion behavior. JSON Schema metadata is read once per
shared schema per interpretation.

The first committed `--` ends option interpretation. An unfinished `--` remains
an option-name prefix until the shell starts the next word. Existing Comline
rules also apply to short groups, repeated options, boolean literals, and
negative or otherwise unrecognized dash-prefixed values.

Shell scripts and a Carapace exporter are not included in this first increment.
Adapters can query these APIs without maintaining another command tree. A static
exporter must map dynamic providers to supported macros or an application query
protocol; JavaScript callbacks cannot be serialized into a static spec.
