# Repository commands

Run these commands from the repository root with `pnpm run <command>`. `mise.toml` selects the toolchain. Package-level commands keep the same meaning while narrowing their scope.

| Command            | Contract                                                                                                                 |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| `fmt`              | Apply the repository formatting policy.                                                                                  |
| `check:fmt`        | Validate formatting without rewriting maintained files; language-specific validators are listed below.                   |
| `check`            | Run every static check listed below. Generated prerequisites and caches may be written; source fixes are explicit.       |
| `test`             | Run the normal test suite once and return a failing status when tests fail.                                              |
| `test:watch`       | Watch the available interactive test suites.                                                                             |
| `build`            | Build distributable artifacts.                                                                                           |
| `verify`           | Run the repository checks, tests, builds, and implemented coverage or compatibility gates.                               |
| `change`           | Author pending release notes.                                                                                            |
| `release:version`  | Prepare versions and release metadata without publishing.                                                                |
| `release:publish`  | Build as required by the release pipeline and publish packages.                                                          |
| `workflows:update` | Update pinned workflow tooling references.                                                                               |
| `cov`              | Run instrumented tests and generate local coverage reports.                                                              |
| `cov:check`        | Generate coverage and enforce the existing baseline policy; Recoverage may synchronize hosted baselines when configured. |

## Static checks

- `check:deps`: `pin-checker --ignore-workspaces`.
- `check:eslint`: `dotenvx run -- turbo run check:eslint`.
- `check:fmt`: `cross-env DPRINT_CACHE_DIR=$PWD/.cache/dprint dprint check .`.
- `check:oxlint`: `dotenvx run -- turbo run check:oxlint`.
- `check:tonnage`: `turbo run check:tonnage`.
- `check:tsc`: `dotenvx run -- turbo run check:tsc`.

## Verification

`pnpm run verify` executes `pnpm run check && pnpm run test && pnpm run build && pnpm run cov:check && pnpm run test:semver`. CI can run these constituent commands in separate jobs. Check failures must propagate to the caller.

Release compatibility checks need access to the Git remote and release tags.

Coverage comparison requires a captured default-branch baseline or access to the hosted baseline through `RECOVERAGE_CLOUD_TOKEN`. Coverage comparison retains the existing Recoverage capture-and-diff behavior; this repository does not expose a separate upload-only command.

Coverage comparison currently covers Comline and Treetrunks; release compatibility covers Comline. Other packages retain their ordinary tests. Rel8 currently has a placeholder test command and no watch suite.

## Migration

`fmt` now applies formatting; use `check:fmt` for the former validation behavior. Package `test` now runs once; use `test:watch` for interactive watching. Existing `test:once` and lint aliases remain for callers, including historical release tests.
