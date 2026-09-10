---
"comline": minor
---

Stop parsing options after the first `--` delimiter and preserve route arguments
before it. Treat all subsequent tokens as positional arguments.

Accept full `process.argv` explicitly and use the standard runtime/entry-point
boundary instead of guessing invocation names. This works for direct and global
commands and for Node, Bun, pnpm, and mise launches.

Breaking: the parser now requires an explicit, full runtime argv array. It no
longer accepts omitted argv, command words alone, or an array prefixed only with
the command name. The first two entries always represent the runtime and entry
point and are skipped before parsing.

- At CLI entry points, replace `parse()` or `parse(process.argv.slice(2))` with
  `parse(process.argv)`.
- For manually constructed input, replace `parse(["mycli", "foo"])` with
  `parse(["node", "mycli", "foo"])`.
