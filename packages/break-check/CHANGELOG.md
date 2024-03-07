# break-check

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
