# comline

## 0.4.3

### Patch Changes

- 93fd532: 🔊 Improve cli debug logging to include the name of the CLI, and clarify the expected type of the log functions needed.

## 0.4.2

### Patch Changes

- c9803fd: 🐛 Further fix facilitating use of arktype/zod (not both)

## 0.4.1

### Patch Changes

- 442b401: 🐛 Fix bug where both `zod` and `arktype` needed to be installed. Now it should be fine to have just one.

## 0.4.0

### Minor Changes

- 9aa40f0: 💥 Drop support for Zod 3.

### Patch Changes

- 9aa40f0: ✨ Support ArkType for options.
- 9aa40f0: ✨ Support Zod 4.

## 0.3.3

### Patch Changes

- 3893540: 🐛 Fix issue where the parsed `path` would incorrectly represent its type using the names of variables instead of the actual values of variables given.

## 0.3.2

### Patch Changes

- f903d0e: ✨ Go-to-definition should now route to source files via source maps now shipped for type declarations.
- Updated dependencies [f903d0e]
  - treetrunks@0.1.5

## 0.3.1

### Patch Changes

- Updated dependencies [089fb5f]
  - treetrunks@0.1.4

## 0.3.0

### Minor Changes

- cb2596b: ⬆️ Use `zod/v4` (included in `zod@^3.25.0`).

## 0.2.5

### Patch Changes

- 29c48a5: ♻️ Changed build vendor from `tsup` to `tsdown`.
- Updated dependencies [29c48a5]
  - treetrunks@0.1.3

## 0.2.4

### Patch Changes

- c8927e5: ♻️ Changed vendors for terminal coloring from `chalk` to `picocolors`, a smaller alternative.

## 0.2.3

### Patch Changes

- c5c9ae1: 🐛 Remove zod from direct dependencies, enabling consumers of comline to plug in any compatible (`^3.0.0`) version of zod.

## 0.2.2

### Patch Changes

- Updated dependencies [f0a729f]
  - treetrunks@0.1.2

## 0.2.1

### Patch Changes

- Updated dependencies [f51ef63]
- Updated dependencies [f51ef63]
- Updated dependencies [f51ef63]
- Updated dependencies [f51ef63]
- Updated dependencies [f51ef63]
  - treetrunks@0.1.1

## 0.2.0

### Minor Changes

- 9e9afe4: 💥 BREAKING CHANGE: Renamed the type `ToPath` to `Split`.
- 9e9afe4: 💥 BREAKING CHANGE: Renamed the type `Flat` to `Flatten`.

### Patch Changes

- Updated dependencies [9e9afe4]
- Updated dependencies [9e9afe4]
- Updated dependencies [9e9afe4]
- Updated dependencies [9e9afe4]
- Updated dependencies [9e9afe4]
- Updated dependencies [9e9afe4]
  - treetrunks@0.1.0

## 0.1.10

### Patch Changes

- Updated dependencies [93e1af1]
  - treetrunks@0.0.5

## 0.1.9

### Patch Changes

- 2743527: ✨ Add `help` function for printing a `CommandLineInterface` to the console.
- 2743527: ✨ Include a new property `definition` on the `parse` function returned from `cli`. This preserves the original `CommandLineInterface` that created the parser.
- 2743527: ✨ Export new functions `helpOptions` and `noOptions`, a time saver for the two most common options patterns.

## 0.1.8

### Patch Changes

- 6771243: ✨ No longer require a `--` separator before positional arguments. So, instead of `my-cli -- do-thing` you can now do `my-cli do-thing`.

## 0.1.7

### Patch Changes

- 635ef98: 🔧 Add repository declaration to manifest.
- Updated dependencies [635ef98]
  - treetrunks@0.0.4

## 0.1.6

### Patch Changes

- Updated dependencies [331800a]
  - treetrunks@0.0.3

## 0.1.5

### Patch Changes

- Updated dependencies [d191b75]
  - treetrunks@0.0.2

## 0.1.4

### Patch Changes

- 1534303: ✨ Add optional setting `debugOutput` to the CLI function that will write logs describing the CLI options retrieval process.

## 0.1.3

### Patch Changes

- Updated dependencies [c847711]
  - treetrunks@0.0.1

## 0.1.2

### Patch Changes

- 0098170: ♻️ Externalized typesafe tree functionality as "treetrunks" library.

## 0.1.1

### Patch Changes

- b88e7eb: ✨ Improve logs and errors to be more clear and specific when missing required arguments.

## 0.1.0

### Minor Changes

- 05f66ce: 💥 BREAKING CHANGE: Options passed via switch or flag are no longer globally defined, but must be explicitly bound to each route.

## 0.0.4

### Patch Changes

- 3e64647: 🐛 Fixed missing export fro the 'encapsulate` function.
- 3e64647: 🐛 Support parsing boolean arguments.

## 0.0.3

### Patch Changes

- 05736f1: ✨ The new `encapsulate()` function can run a callback in a sandbox where any calls to stdout, stderr, or the console can be captured. This can be helpful for command line utilities that need stdout to match a certain format.

## 0.0.2

### Patch Changes

- bbb8d2e: ✨ The `required` and `optional` utility functions improve the readability of positional argument trees."

## 0.0.1

### Patch Changes

- 88d556c: ♻️ Comline will now always look for a `<cli-name>.config.json`, and will never error if a config file can't be found.
- 88d556c: ✨ No longer require a parser to be passed if the type of your argument is "string"
