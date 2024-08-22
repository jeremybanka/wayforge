# break-check

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
