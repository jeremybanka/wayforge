# recoverage

## 0.1.6

### Patch Changes

- comline@0.2.1

## 0.1.5

### Patch Changes

- Updated dependencies [9e9afe4]
- Updated dependencies [9e9afe4]
  - comline@0.2.0

## 0.1.4

### Patch Changes

- 17a7873: 📝 Update `README.md` with an overview and walkthrough.

## 0.1.3

### Patch Changes

- 93e1af1: 📝 Update README.md.
  - comline@0.1.10

## 0.1.2

### Patch Changes

- f2b7740: ✨ Report json summary to recoverage.cloud.

## 0.1.1

### Patch Changes

- 2f78638: 🔊 Improve the quality and consistency of logs.
- 2f78638: 🚀 In CI, recoverage would previously fetch the main branch twice, with each fetch taking ~500ms. Now it only fetches once, reducing running time on github actions by ~;25%.

## 0.1.0

### Minor Changes

- e951247: 🚀 Improve performance by 2x by removing need to spawn processes.
- e951247: ➖ Drop peer dependency `nyc`.
- e951247: ✨ Add coverage report transformations to recoverage/lib.

## 0.0.10

### Patch Changes

- 277ac67: 🚀 Only spawn one git client and retrieve git data once.
- 277ac67: 🐛 Fix bug where an incorrect endpoint on recoverage.cloud would be used when persisting a report.

## 0.0.9

### Patch Changes

- 6ad75b0: 🐛 Previously, recoverage would in some situations clear the default branch's coverage report. Now this coverage report will never be cleared.

## 0.0.8

### Patch Changes

- 2d1b35f: ✨ Add system for automatic backup on https://recoverage.cloud/.

## 0.0.7

### Patch Changes

- 027b09d: ➕ Add dependencies `tmp` and `simple-git` (which were already necessary but declared as dev dependencies).

## 0.0.6

### Patch Changes

- 4fb17ab: 💄 Recoverage output is much more beautiful and resembles vitest diffs. It also now renders properly in github actions.

## 0.0.5

### Patch Changes

- 747ea66: ✨ Add the simple invocation, `recoverage`. This invocation runs both `recoverage capture`, placing your current coverage state into your coverage database, and `recoverage diff`, comparing the current coverage state of your package to its coverage state on your repo's default branch.
- 747ea66: ✨ Pass `default-branch` as an option to `recoverage` and `recoverage diff`.

## 0.0.4

### Patch Changes

- 2743527: ✨ Add a `--help` page to the CLI.
- Updated dependencies [2743527]
- Updated dependencies [2743527]
- Updated dependencies [2743527]
  - comline@0.1.9

## 0.0.3

### Patch Changes

- 238d521: ➕ Add `nyc` as a peer dependency. Recoverage currently relies on its executable being present in the project.
- 238d521: 🔊 If `nyc` fails to create coverage reports, log an error explaining what happened.
- 238d521: 🐛 Fix bug where, if recoverage was run from a diectory in a repo other than the root itself, when that repo was dirty, it would fail to compute the hash representing the repo's dirty state.

## 0.0.2

### Patch Changes

- 780567b: ✨ Use recoverage with an S3-compatible backend.

## 0.0.1

### Patch Changes

- 6771243: ♻️ Simplify design of `recoverage capture`.
- Updated dependencies [6771243]
  - comline@0.1.8
