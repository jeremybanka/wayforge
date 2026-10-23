# Repository commands

Run these commands from the repository root with `pnpm run <command>`. `mise.toml` selects the toolchain. Package-level commands keep the same meaning while narrowing their scope.

Following the [mise Node.js cookbook](https://mise.jdx.dev/mise-cookbook/nodejs.html#add-node-modules-binaries-to-the-path), mise adds the repository root’s `node_modules/.bin` to `PATH`. With shell activation or `mise exec -- <tool>`, installed dependency CLIs are available from the root and package directories.

| Command            | Contract                                                                                                                 |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| `fmt`              | Apply the repository formatting policy.                                                                                  |
| `check:fmt`        | Validate formatting without rewriting maintained files; language-specific validators are listed below.                   |
| `check`            | Run every static check listed below. Generated prerequisites and caches may be written; source fixes are explicit.       |
| `test`             | Run the normal test suite once and return a failing status when tests fail.                                              |
| `test:watch`       | Watch the available interactive test suites.                                                                             |
| `build`            | Build distributable artifacts.                                                                                           |
| `change`           | Author pending release notes.                                                                                            |
| `release:version`  | Prepare versions and release metadata without publishing.                                                                |
| `release:publish`  | Build as required by the release pipeline and publish packages.                                                          |
| `workflows:update` | Update pinned workflow tooling references.                                                                               |
| `cov`              | Run instrumented tests and generate local coverage reports.                                                              |
| `cov:check`        | Generate coverage and enforce the existing baseline policy; Recoverage may synchronize hosted baselines when configured. |

## Static checks

- `check:correctly`: `correctly check --offline`, validating configuration against the committed schema snapshots.

- `check:deps`: `pin-checker --ignore-workspaces`.
- `check:eslint`: `dotenvx run -- turbo run check:eslint`.
- `check:fmt`: `cross-env DPRINT_CACHE_DIR=$PWD/.cache/dprint dprint check .`.
- `check:lasertag`: `turbo run check:lasertag`, validating Tempest component-owned CSS Modules against their rendered DOM.
- `check:oxlint`: `dotenvx run -- turbo run check:oxlint`.
- `check:readme`: `turbo run check:readme`, checking the generated package READMEs, including Tonnage bundle reports.
- `check:tsc`: `dotenvx run -- turbo run check:tsc`.

## Command notes

Treetrunks, Varmint, Venerate, and tsdoc.json generate their `README.md` files from `README.mdx` with Galley. Edit the MDX sources, then run `pnpm readme:write`; `pnpm check:readme` checks for drift. Both commands build the packages first and run uncached. The existing `tonnage:write` and `check:tonnage` commands delegate to these commands. Generated READMEs are excluded from formatting so Galley owns their output.

Release compatibility checks need access to the Git remote and release tags. `pnpm test:breakage` runs Comline’s uncached `test:breakage:prelude` before its cacheable compatibility check. The prelude refreshes the gitignored `.breakage/baseline.json` snapshot; Turbo hashes it after the prelude completes, so a new release or moved tag invalidates the check’s cache. When running the package scripts directly, run `pnpm --filter comline test:breakage:prelude` before `pnpm --filter comline test:breakage`.

Coverage comparison requires a captured default-branch baseline or access to the hosted baseline through `RECOVERAGE_CLOUD_TOKEN`. Coverage comparison retains the existing Recoverage capture-and-diff behavior; this repository does not expose a separate upload-only command.

Coverage comparison currently covers Comline and Treetrunks; release compatibility covers Comline. Other packages retain their ordinary tests. Rel8 currently has a placeholder test command and no watch suite.

## Migration

`fmt` now applies formatting; use `check:fmt` for the former validation behavior. Package `test` now runs once; use `test:watch` for interactive watching. Use the canonical commands directly; superseded names have been removed.

## Configuration validation

Run `pnpm run check:correctly` for the same offline validation used by the `Check / Correctly` CI job. Correctly's associations in `correctly.config.ts` cover repository tooling; TypeScript and editor settings receive JSONC syntax checks. Fixture directories, Varmint recordings (including deliberately non-JSON error files), and package-manager lockfiles are excluded.

Commit the entire `.correctly/` directory, including its lock and schema snapshots. Formatters exclude this directory because changing snapshot bytes invalidates their digests. After intentionally changing associations, run `pnpm exec correctly schemas pull --all`, review the snapshot diff, and rerun the check. For an upstream schema refresh, use `pnpm exec correctly schemas pull --association 'Dprint'` (or another association name). Renovate refreshes only the relevant remote associations after dependency installation. Package-local schemas follow their installed dependency versions.

Editors use the same configuration and snapshots. For VS Code, run `pnpm exec correctly vsix` to build and install the extension matching the installed package. Other LSP clients can run `node_modules/.bin/correctly-lsp --stdio`. Trust the workspace before enabling executable TypeScript configuration.

The initial Renovate snapshot is inherited byte-for-byte from atom.io's reviewed `renovate@44.148.4` snapshot, preserving its digest and discovery metadata. The current upstream schema incorrectly rejects the `installTools` tool names; refreshing Renovate may expose that regression until upstream fixes it. Remote schema downloads permit up to 8 MiB because the current Renovate schema exceeds Correctly's default 2 MiB limit.
