# treetrunks

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

## 0.0.4

### Patch Changes

- 635ef98: 🔧 Add repository declaration to manifest.

## 0.0.3

### Patch Changes

- 331800a: 🧹 Remove extra console.log

## 0.0.2

### Patch Changes

- d191b75: 🐛 Fix bug where wildcards were always rejected from `isTreePath`.

## 0.0.1

### Patch Changes

- c847711: ✨ isTreePath provides runtime validation for unknown paths.
