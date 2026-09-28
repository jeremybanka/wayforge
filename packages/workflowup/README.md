# workflowup

Upgrade GitHub Actions to commit SHAs for the latest stable tags and update pinned `jdx/mise-action` tool versions. Extracted from Lasertag's Node workflow updater, with a reusable CLI and TypeScript API.

## Usage

Requires Node.js 22 or newer and Git on `PATH`. Run from a repository root:

```sh
pnpm add -D workflowup
pnpm exec workflowup --dry-run
pnpm exec workflowup
```

Use `--cwd /path/to/repository` to target another repository. `--help` lists the available flags. Dry runs resolve and report the same upgrades without writing files. Git uses your existing authentication configuration; the package does not require GitHub CLI or an API token.

```yaml
# Before
- uses: actions/checkout@v4.2.2

# After (the exact SHA and version depend on the latest stable release)
- uses: actions/checkout@<commit-sha> # v<version>
```

The updater reads workflows under `.github/workflows` and composite `action.yml` / `action.yaml` files anywhere under `.github`. It supports ordinary step actions, action subdirectories, and reusable workflows. A tag such as `v4` or `v4.2.2`, or a full SHA with a leading version comment such as `# v4.2.2`, identifies an upgradeable action. Stable upgrades may cross major versions; review the diff and upstream migration notes before merging.

Annotated tags are peeled to commits. Each repository's tags are fetched once per invocation, and release tags are compared numerically. A newer version is never replaced with an older stable version: a newer tag is pinned to its own commit, or the command fails if that tag cannot be resolved. Existing quotes, line endings, explanatory comments, and unrelated YAML remain intact. Only the `with.version` input on the same `jdx/mise-action` step is updated; floating or expression-based mise inputs remain unchanged.

## Immutable action policy

SHA pinning is mandatory. There is no option to retain mutable action refs. On a successful run, every remote GitHub action or reusable workflow reference in the supported files uses a full 40-character commit SHA. An existing SHA without a version comment remains pinned; the updater does not guess which release it represents. A dry run validates the same policy and reports proposed edits without applying them.

Numeric release tags are resolved to SHAs. Branch refs, custom nonnumeric tags, abbreviated SHAs, and expressions in `uses` fail with an actionable error. Docker actions must already use a full `@sha256:` digest; registry tag resolution is not implemented. Local `./` actions remain local. YAML aliases in action/job/step structures, merge keys in these mappings, and anchored, multiline, or flow-style `uses` values are rejected instead of silently bypassing the policy. Aliases in unrelated values such as environment settings do not interfere with updates.

Shell-script contents and unrelated YAML files are never searched for action references. Parsing, unsupported-reference, and remote lookup errors fail before any workflow files are written. Files are checked for concurrent edits before writing, but writes across multiple files are not a filesystem transaction. SHA pinning prevents a ref from silently moving after review; it does not establish that upstream code is trustworthy or that a major upgrade is compatible.

## Adoption and scope

The CLI is independent of Wayforge, pnpm, mise, Turbo, Vite+, and a project's runtime or language. Install it with your package manager or run it as a standalone Node CLI in a Python, Rust, Go, or other repository. Git supplies authentication for private GitHub repositories. Existing tag refs can be migrated directly; existing annotated pins retain readable version comments.

The current scope is GitHub.com, numeric release tags, regular workflow files under `.github/workflows`, and composite actions under `.github`. Composite actions elsewhere in the repository, scripts that download dependencies, action internals in upstream repositories, and other workflow fields such as container images are outside the scan. GitHub Enterprise host configuration, branch/custom-tag tracking, Docker tag upgrades, version-range or major-version restrictions, and dependency PR creation are not implemented. A repository that uses unsupported mutable `uses` references must explicitly pin or migrate them before adopting the command; the immutable policy cannot be disabled.

## API

```ts
import { upgradeWorkflows } from "workflowup"

const result = await upgradeWorkflows({
	cwd: "/path/to/repository",
	dryRun: true,
})

console.log(result.files) // Absolute paths that would change
console.log(result.updates) // Per-occurrence current/target versions and refs
```

Omitting `cwd` uses `process.cwd()`. Omitting `dryRun` applies the upgrades. Unknown options and invalid option types are rejected. Importing the package has no side effects.

## Development

From the Wayforge root, run `pnpm --filter workflowup build`, `pnpm --filter workflowup check`, and `pnpm --filter workflowup test`. The tests use fixtures and local Git repositories, including actual CLI invocations; they do not contact GitHub.
