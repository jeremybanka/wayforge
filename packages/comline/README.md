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
