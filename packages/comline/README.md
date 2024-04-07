# comline

```sh
bun i comline
```

comline makes it easy to turn a typescript function into a command line tool.

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
import { greet } from "./greet"

import { cli, parseNumberArg, parseStringArg } from "comline"
import { z } from "zod"

const greetCli = cli({
  discoverConfigPath: (positionalArgs) => path.join(process.cwd(), `.greet-config.json`),
  optionsSchema: z.object({
    name: z.string(),
    age: z.number(),
  }),
  options: {
    name: {
      description: `name`,
      example: `--name=hello`,
      flag: `n`,
      parse: parseStringArg,
      required: true,
    },
    age: {
      description: `age`,
      example: `--age=1`,
      flag: `a`,
      parse: parseNumberArg,
      required: true,
    },
  },
})

const { suppliedOptions: { name, age } } = greetCli(process.argv)
const output = greet(name, age) 
process.stdout.write(output)
```

then, run the file `greet.x.ts` with the following command:

```sh
bun greet.x.ts --name=jeremybanka --age=1
```

this will print `Hello, jeremybanka!`

## features
- [x] switches (`--age`)
  - `""` will be provided to the parse function for `age` in this case
- [x] switches with values (`--age=1`)
  - `"1"` will be provided to the parse function for `age` in this case
- [x] multiple instances of the same switch (`--age=1 --age=2`) 
  - `"1,2"` will be provided to the parse function for `age` in this case
- [x] flags (`-a`)
  - `""` will be provided to the parse function for `age` in this case
- [x] multiple instances of the same flag (`-aa`)
  - `","` will be provided to the parse function for `age` in this case
- [x] flags with values (`-a=1`)
  - `"1"` will be provided to the parse function for `age` in this case
- [x] combined flags (`-na`)
  - `""` will be provided to the parse function for `name` in this case
  - `""` will be provided to the parse function for `age` in this case
- [x] positional arguments (`my-cli -- positional`)
  - validated as a "route" into the tree of positional arguments
  ```typescript
  import { Tree, TreePath, OPTIONAL, REQUIRED } from "comline"

  const myTree = [
    REQUIRED,
    {
      hello: [
        OPTIONAL,
        {
          world: null,
          $name: [
            OPTIONAL,
            {
              good: [
                REQUIRED,
                { 
                  morning: null 
                }
              ],
            },
          ],
        },
      ],
    },
  ] satisfies Tree

  const validPaths: TreePath<typeof myTree>[] = [
    [`hello`],
    [`hello`, `world`],
    [`hello`, `jeremybanka`],
    [`hello`, `jeremybanka`, `good`, `morning`],
  ]
  ```
  

## limitations

- comline supports positional arguments, but only following the `--` convention.
- comline supports options with values, but only when using `=` to separate the option name from the value.
- flags are supported, but they must be single characters, either uppercase or lowercase.
