# comline

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

- comline supports positional arguments, but only following the `--` convention.
- flags are supported, but they must be single characters, either uppercase or lowercase.
