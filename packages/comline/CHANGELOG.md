# comline

## 0.6.3

### Patch Changes

- 77add5d: Rank complete interpretations supported by their own route grammar during final invocation. Descendant options cannot invalidate a valid command or silently consume its positional arguments. Reject input when no complete interpretation is valid, and retain explicit boundary requirements for equally ranked interpretations with different positional paths. Completion can still interpret unfinished descendant commands.
- 77add5d: Return an always-present `warnings` array for unknown options and options invalid on the selected route. Malformed option assignments also produce warnings, and each invalid short flag occurrence is reported in argument order. Warnings include option spelling, word index within `argv.slice(2)`, and selected command context; consumed values follow the selected route’s grammar and do not produce warnings. Display messages escape argument control characters while structured fields retain raw input. Interpretation and completion defer warnings while viable descendant commands remain possible; finalized invocations diagnose the selected route. Export `CliWarning`, reusable `formatWarnings`, and opt-in `logWarnings` with stderr output, custom logging, and color controls. Parsing does not automatically log warnings.

## 0.6.2

### Patch Changes

- 7ece520: Add opt-in tab completion for Bash, Zsh, Fish, Nushell, and Carapace, driven by the same CLI definitions and argument interpretation as normal parsing. Integrations work with globally installed commands and Bun-compiled executables. Shell adapters use the engine's replacement boundaries to preserve literal positional arguments and option values, encode Nushell literals without expansion, quote shell syntax (including empty values in Bash, Zsh, and Fish), decode Bash ANSI-C completion quoting, and retain directory continuation. Suggest reachable options before command selection. Ordinary parsing avoids constructing the completion view and its presentation metadata, and completion shares the scanner's pending-value state and the viable grammar for each pending option. Memoize completion choices and presentation signatures within each interpretation while keeping definition changes visible on later requests. Accumulate repeated option occurrences without repeatedly copying the growing array. Ordinary invocation retains the selected route's own option occurrences even when descendant options appear more often. Route-specific consumption prevents unreachable sibling options from swallowing command words; genuinely ambiguous boundaries require an inline value or `--`.

  - Add `interpret()` and asynchronous `complete()` methods to configured CLIs, plus standalone interpretation and completion functions. Inspect unfinished commands, routes, raw option occurrences, and cursor replacement ranges without running option parsers, validating input, or discovering application configuration.
  - Suggest commands, option names, schema-derived values, and explicitly configured candidates. Filter separated value candidates through their route grammar so accepting a suggestion cannot reinterpret it as another option; inline assignments retain those values. Support file and directory hints, descriptions, spacing control, variable positional arguments, and synchronous or asynchronous candidate providers.
  - Add option `aliases` for additional long names and `valueKind` to override schema-based value consumption consistently in parsing and completion.

  Use `completionResponse(definition, process.argv)` at the CLI entry point to opt in to completion requests and installation commands. `completion <target>` prints a standalone integration file; `completionScript()` provides the same generation API. Support Cobra's `__complete` and `__completeNoDesc` protocols and Carapace's native JSON export protocol. Fish support requires version 4 or newer. Fish preserves the exact candidate set and follows its native spacing rules; it does not support arbitrary no-space hints.

  Install files explicitly with `completion install <bash|zsh|fish|nushell|carapace>` or `installCompletion()`. Installation checks dependencies, discovers conventional destinations, and atomically installs or replaces the CLI's completion file without editing shell profiles. Discover settings through login initialization, with non-login interactive fallback. Report actionable errors for missing prerequisites, unsuitable destinations, or conflicting registrations. The opt-in transport completes these management commands and their supported targets.

  Filesystem candidates requested through `~/` resolve to the discovered absolute path in Nushell and Carapace; provider-supplied tildes remain literal. Nushell uses its user vendor autoload directory and preserves existing completion providers and the external-completion enable setting. Carapace uses its discovered specs directory and the user's existing shell integration. The two integrations are independent; Nu users already using Carapace need only the Carapace spec.

## 0.6.1

### Patch Changes

- fcf1e8d: Render empty tables and help for CLIs with no configured routes without throwing.
- 7b68b5a: Restore stdout, stderr, and console methods when an encapsulated callback throws or rejects, preserving the original methods after every capture.

## 0.6.0

### Minor Changes

- 8918771: Stop parsing options after the first `--` delimiter and preserve route arguments before it. Treat all subsequent tokens as positional arguments.

  Accept full `process.argv` explicitly and use the standard runtime/entry-point boundary instead of guessing invocation names. This works for direct and global commands and for Node, Bun, pnpm, and mise launches.

  Breaking: the parser now requires an explicit, full runtime argv array. It no longer accepts omitted argv, command words alone, or an array prefixed only with the command name. The first two entries always represent the runtime and entry point and are skipped before parsing.

  - At CLI entry points, replace `parse()` or `parse(process.argv.slice(2))` with `parse(process.argv)`.
  - For manually constructed input, replace `parse(["mycli", "foo"])` with `parse(["node", "mycli", "foo"])`.

## 0.5.4

### Patch Changes

- Updated dependencies [413ab8f]
  - treetrunks@0.1.11

## 0.5.3

### Patch Changes

- Updated dependencies [5c9016d]
  - treetrunks@0.1.10

## 0.5.2

### Patch Changes

- 7b66e63: License all first-party code and assets under the Mozilla Public License 2.0 and include the license notice in published packages.
- Updated dependencies [7b66e63]
  - treetrunks@0.1.9

## 0.5.1

### Patch Changes

- b4c93d6: Improve the appearance of help output for options without short flags.

## 0.5.0

### Minor Changes

- 06c0f4a: Allow long switches and short flags to accept values from the following command
  line argument, so `--option value` and `-o value` work the same as
  `--option=value` and `-o=value`.
- 06c0f4a: Use Standard Schema and Standard JSON Schema as the shared integration point for
  schema validation, help output, JSON Schema export, and option arity detection.

## 0.4.8

### Patch Changes

- 523a6bd: Update the README to document the current route options, option parsers, parser
  outputs, and JSON Schema writing API.

## 0.4.7

### Patch Changes

- Updated dependencies [a809148]
  - treetrunks@0.1.8

## 0.4.6

### Patch Changes

- 7a2d506: Use Node's built-in `styleText` for terminal colors instead of depending on `picocolors`.

## 0.4.5

### Patch Changes

- Updated dependencies [a5a7cdc]
  - treetrunks@0.1.7

## 0.4.4

### Patch Changes

- Updated dependencies [f619282]
  - treetrunks@0.1.6

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
