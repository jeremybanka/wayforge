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

- `check:deps`: `pin-checker --ignore-workspaces`.
- `check:eslint`: `dotenvx run -- bun scripts/pipeline.bun.ts check:eslint`.
- `check:fmt`: `cross-env DPRINT_CACHE_DIR=$PWD/.cache/dprint dprint check .`.
- `check:lasertag`: `bun scripts/pipeline.bun.ts check:lasertag`, validating Tempest component-owned CSS Modules against their rendered DOM.
- `check:oxlint`: `dotenvx run -- bun scripts/pipeline.bun.ts check:oxlint`.
- `check:tonnage`: `bun scripts/pipeline.bun.ts check:tonnage`.
- `check:tsc`: `dotenvx run -- bun scripts/pipeline.bun.ts check:tsc`.

## Command notes

Root build, check, test, and coverage commands use `scripts/pipeline.bun.ts` to run named pipelines from `pnpm-workspace.yaml`. They select the whole workspace with `--full`, preserving the existing command scope. pnpm performs a frozen install before running each pipeline. Task outputs and logs are cached locally in pnpm's cache directory; `outputs: []` caches successful checks without restoring files. Tonnage checks, baseline comparisons, release hooks, and watchers run uncached. Package inputs include tracked and untracked, unignored files by default, including fixtures and configuration. The launcher fingerprints shared root files, the Bun runtime, local `.env*` files, and inherited `VITE_*` values; task keys also include `CI`, `NODE_ENV`, and `PREVIEW`. Keep using the root commands so this shared context participates in cache keys.

Inspect a pipeline without installing dependencies or executing scripts with `bun scripts/pipeline.bun.ts build --dry-run --json`. Add `--no-cache` to a root pipeline command to run without reading or writing task results. When narrowing to a package, select its dependency closure, for example `bun scripts/pipeline.bun.ts test --filter 'comline...'`. The launcher delegates filtered runs to pnpm's uncached recursive task graph because `pnpm pipeline` currently ignores filters. Task dependencies do not expand the selected projects. Raw `pnpm pipeline` calls bypass the launcher's shared-file fingerprint and Breakage preparation.

`test:watch` and `watch:types` use pnpm's recursive task graph with enough concurrency for every watcher. Their generation and build prerequisites finish before each watcher starts. Recursive runs honor task dependencies but do not restore cached results. Release hooks run the packages' `postversion` scripts after their workspace build prerequisites.

Release compatibility checks need access to the Git remote and release tags. `pnpm test:breakage` runs Comline's uncached `test:breakage:prelude`, fingerprints its gitignored `.breakage/baseline.json` snapshot, then starts the cacheable pipeline. pnpm hashes its graph before executing tasks and does not enumerate ignored inputs, so the prelude must finish before the pipeline starts. A new release or moved tag changes the fingerprint and invalidates the compatibility check. When running the package scripts directly, run `pnpm --filter comline test:breakage:prelude` before `pnpm --filter comline test:breakage`.

`pnpm test:pipeline` runs isolated workspace integration tests for dependency ordering, output restoration, shared configuration and environment invalidation, and Breakage baseline refresh. The normal root `test` command runs these tests before the package suites.

Coverage comparison requires a captured default-branch baseline or access to the hosted baseline through `RECOVERAGE_CLOUD_TOKEN`. Coverage comparison retains the existing Recoverage capture-and-diff behavior; this repository does not expose a separate upload-only command.

Coverage comparison currently covers Comline and Treetrunks; release compatibility covers Comline. Other packages retain their ordinary tests. Rel8 currently has a placeholder test command and no watch suite.

## Remote task cache

pnpm 12.12 and later can use a server implementing the Turborepo Remote Cache API, but pnpm artifacts use their own keys and signed format. Existing Turbo cache entries are not migrated. Configure the following GitHub Actions values for the Lint and Test workflows:

| Kind     | Name                             | Value                                                                                |
| -------- | -------------------------------- | ------------------------------------------------------------------------------------ |
| Secret   | `PNPM_REMOTE_CACHE_URL`          | Cache API base URL, using the existing cache server if it supports pnpm's requests.  |
| Secret   | `PNPM_REMOTE_CACHE_TOKEN`        | Server authentication token. The launcher maps it to pnpm's URL-scoped auth setting. |
| Variable | `PNPM_REMOTE_CACHE_TEAM`         | Cache server team ID or slug.                                                        |
| Variable | `PNPM_REMOTE_CACHE_TRUSTED_KEYS` | JSON object mapping `ci` to its base64 P-256 SPKI DER public key.                    |
| Secret   | `PNPM_REMOTE_CACHE_PRIVATE_KEY`  | Base64 P-256 PKCS#8 DER private key for `ci`.                                        |

The URL, token, and team fall back to the existing `TURBO_API`, `TURBO_TOKEN`, and `TURBO_TEAMID` values, respectively. Signing keys still need to be configured for pnpm. The workflows use organization `wayforge`, key ID `ci`, and builder ID `github-actions`. Only pushes publish task results; pull requests can read trusted results. Unset settings are omitted, and local caching works without remote credentials. Generate a signing pair and configure local readers following pnpm's [shared cache instructions](https://pnpm.io/pnpr/shared-side-effects-cache). Local readers need the server URL, team, authentication, organization, and trusted public key; keep the private key in CI. No signing material belongs in `pnpm-workspace.yaml`.

## Migration

`fmt` now applies formatting; use `check:fmt` for the former validation behavior. Package `test` now runs once; use `test:watch` for interactive watching. Use the canonical commands directly; superseded names have been removed.
