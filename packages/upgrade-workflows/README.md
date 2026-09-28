# upgrade-workflows

Upgrade GitHub Actions to commit SHAs for the latest stable tags and update pinned `jdx/mise-action` tool versions. Extracted from Lasertag's Node workflow updater, with a reusable CLI and TypeScript API.

## Usage

Requires Node.js 22 or newer and Git on `PATH`. Run from a repository root:

```sh
pnpm add -D upgrade-workflows
pnpm exec upgrade-workflows --dry-run
pnpm exec upgrade-workflows
```

Use `--cwd /path/to/repository` to target another repository. `--help` lists the available flags. Dry runs resolve and report the same upgrades without writing files. Git uses your existing authentication configuration; the package does not require GitHub CLI or an API token.

```yaml
# Before
- uses: actions/checkout@v4.2.2

# After (the exact SHA and version depend on the latest stable release)
- uses: actions/checkout@<commit-sha> # v<version>
```

The updater reads workflows under `.github/workflows` and composite `action.yml` / `action.yaml` files anywhere under `.github`. It supports ordinary step actions, action subdirectories, and reusable workflows. A tag such as `v4` or `v4.2.2`, or a full SHA with a leading version comment such as `# v4.2.2`, identifies an upgradeable action. Stable upgrades may cross major versions; review the diff and upstream migration notes before merging.

Annotated tags are peeled to commits. Each repository's tags are fetched once per invocation, and release tags are compared numerically. A newer version is never replaced with an older stable version. Existing quotes, line endings, explanatory comments, and unrelated YAML remain intact. Only the `with.version` input on the same `jdx/mise-action` step is updated; floating or expression-based mise inputs remain unchanged.

Local actions, Docker actions, branch refs, expressions, and SHAs without version comments are left alone. YAML aliases, anchored values, multiline values, and flow-style values without room for an inline version comment are also left alone. Shell-script contents and unrelated YAML files are never searched for action references. YAML or remote lookup errors fail before any workflow files are written.

## API

```ts
import { upgradeWorkflows } from "upgrade-workflows"

const result = await upgradeWorkflows({
	cwd: "/path/to/repository",
	dryRun: true,
})

console.log(result.files) // Absolute paths that would change
console.log(result.updates) // Per-occurrence current/target versions and refs
```

Omitting `cwd` uses `process.cwd()`. Omitting `dryRun` applies the upgrades. Importing the package has no side effects.

## Development

From the Wayforge root, run `pnpm --filter upgrade-workflows build`, `pnpm --filter upgrade-workflows check`, and `pnpm --filter upgrade-workflows test`. The tests use fixtures and local Git repositories, including actual CLI invocations; they do not contact GitHub.
