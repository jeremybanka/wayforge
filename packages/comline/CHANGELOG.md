# comline

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
