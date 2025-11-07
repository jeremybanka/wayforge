# break-check

## 0.6.23

### Patch Changes

- Updated dependencies [619f89e]
  - takua@0.1.1

## 0.6.22

### Patch Changes

- 9b8aff4: ✨ Improved appearance of debug logging.
- Updated dependencies [9b8aff4]
  - takua@0.1.0

## 0.6.21

### Patch Changes

- Updated dependencies [93fd532]
  - comline@0.4.3

## 0.6.20

### Patch Changes

- Updated dependencies [c9803fd]
  - comline@0.4.2

## 0.6.19

### Patch Changes

- Updated dependencies [442b401]
  - comline@0.4.1

## 0.6.18

### Patch Changes

- 9aa40f0: 🐛 fix issue where baseDirName wasn't included as an option
- Updated dependencies [9aa40f0]
- Updated dependencies [9aa40f0]
- Updated dependencies [9aa40f0]
  - comline@0.4.0

## 0.6.17

### Patch Changes

- Updated dependencies [3893540]
  - comline@0.3.3

## 0.6.16

### Patch Changes

- f903d0e: ✨ Go-to-definition should now route to source files via source maps now shipped for type declarations.
- Updated dependencies [f903d0e]
  - comline@0.3.2

## 0.6.15

### Patch Changes

- comline@0.3.1

## 0.6.14

### Patch Changes

- cb2596b: ⬆️ Use `zod/v4` (included in `zod@^3.25.0`).
- Updated dependencies [cb2596b]
  - comline@0.3.0

## 0.6.13

### Patch Changes

- 29c48a5: ♻️ Changed build vendor from `tsup` to `tsdown`.
- Updated dependencies [29c48a5]
  - comline@0.2.5

## 0.6.12

### Patch Changes

- Updated dependencies [c8927e5]
  - comline@0.2.4

## 0.6.11

### Patch Changes

- Updated dependencies [c5c9ae1]
  - comline@0.2.3

## 0.6.10

### Patch Changes

- comline@0.2.2

## 0.6.9

### Patch Changes

- comline@0.2.1

## 0.6.8

### Patch Changes

- Updated dependencies [9e9afe4]
- Updated dependencies [9e9afe4]
  - comline@0.2.0

## 0.6.7

### Patch Changes

- comline@0.1.10

## 0.6.6

### Patch Changes

- 2743527: ✨ Add a `--help` page to the CLI.
- Updated dependencies [2743527]
- Updated dependencies [2743527]
- Updated dependencies [2743527]
  - comline@0.1.9

## 0.6.5

### Patch Changes

- 635ef98: 🔧 Add repository declaration to manifest.

## 0.6.4

### Patch Changes

- 05f66ce: ✨ Options are no longer required for schema generation.

## 0.6.3

### Patch Changes

- d8749a8: 💬 The logged output from `break-check`'s CLI is now much easier to read.

## 0.6.2

### Patch Changes

- 5793f4d: 🐛 In previous versions, the executable build artifact was missing. Now it is included under bin/break-check.x.js. The prepacked break-check.schema.json file was also missing and now lives in dist/.

## 0.6.1

### Patch Changes

- bb734ff: ✨ When break check completes, only changes beneath the base directory will be stashed.
- bb734ff: 🐛 Fix bug where break check would hang in the event that breaking changes were found but not certified.

## 0.6.0

### Minor Changes

- 3e64647: 🚀 Break check no longer fetches all tags, leading to major speed improvements for repos with many releases.
- 3e64647: ✨ The `--verbose` flag will print statistical information about performance.

## 0.5.0

### Minor Changes

- 05736f1: 💥 BREAKING CHANGE: break-check now outputs a result in json format. This is the only data released to stdout in the executable.
- 05736f1: 🐛 Fix bug where break check would not exit gracefully when the repo was dirty.
- b30015e: ✨ break-check no longer runs a global checkout, making it possible to run multiple jobs simultaneously.

## 0.4.0

### Minor Changes

- 88d556c: ✨ Run break-check with a `break-check.config.json` file.

## 0.3.0

### Minor Changes

- fe4a79c: 💥 BREAKING CHANGE: break-check now requires a "--certifyCommand" option to be passed. This is a shell command which, when run, determines whether breaking changes have been accounted for.

## 0.2.0

### Minor Changes

- a96a798: ✨ Break check will now return an exit code 2 if no tests can be found matching your supplied testPattern.

### Patch Changes

- a96a798: 🐛 break-check will now return you to your working branch after completing its run, rather than a detached HEAD at that ref.
- a96a798: 🐛 The break-check cli will now exit 100 if required arguments are missing.

## 0.1.0

### Minor Changes

- 82305d4: ✨ Will now fetch all tags before trying to check out the tag for the latest release.
- 82305d4: 🐛 Fix bug where, if you have no tests, the release version would be checked out again.

### Patch Changes

- d949cce: 🐛 Fix issue where break-check could not detect breaking changes, due to a failure to await checking out the last tag's public tests. Now the checkout is awaited.
