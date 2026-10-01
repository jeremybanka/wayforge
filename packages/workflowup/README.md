# workflowup

Maintain SHA-pinned GitHub Actions without giving the routine dependency bot permission to rewrite workflows. `workflowup` provides a Node CLI and TypeScript API for upgrading action pins to the latest stable releases and updating pinned `jdx/mise-action` tool versions.

## Why workflowup alongside Renovate?

`workflowup` makes workflow maintenance practical while keeping workflow-writing authority out of the routine dependency updater. It grew out of repository-local updaters in our sister projects; this package shares Lasertag's Node approach so that maintaining that security posture does not require each project to maintain its own script.

Renovate already supports [updating and SHA-pinning GitHub Actions](https://docs.renovatebot.com/modules/manager/github-actions/#digest-pinning-and-updating). Updating files under `.github/workflows` also requires [workflow-writing permission](https://docs.renovatebot.com/modules/platform/github/): `Workflows: write` for a GitHub App or fine-grained token, or the `workflow` scope for a classic personal access token. That authority can change the jobs that test, publish, and deploy the project, including jobs with access to secrets and privileged tokens.

A dependency updater processes third-party metadata and, depending on configuration, runs package-manager scripts, plugins, or migration commands. Keeping its identity unable to write workflow definitions removes a sensitive capability from that process. In [Wayforge's Renovate job](https://github.com/jeremybanka/wayforge/blob/main/.github/workflows/renovate.yml), the requested App-token permissions omit workflow writing. Dashboard approval for action upgrades is an additional scheduling control; it does not grant the missing permission or substitute for restricting credentials.

### What a stolen dependency-bot credential can become

Imagine a routine dependency update encounters a compromised package-manager script or plugin. During the automated run, an attacker obtains the updater's GitHub token. That token can already write dependency branches and open pull requests, and it was also granted workflow-writing permission to keep GitHub Actions up to date.

Using the stolen credential, the attacker submits a familiar-looking maintenance PR under the bot's identity. Alongside the expected version bump, it changes the publishing workflow to send the job's package-registry credential to the attacker. The ordinary tests still run and pass. If the malicious change is missed in review or accepted by an automerge policy, the next authorized release runs the altered workflow with its configured publishing secret. The attacker can then publish a malicious package version to downstream users.

The stolen updater token did not need an API that reveals secret values. Permission to rewrite the workflow created a route to credentials supplied to that workflow later. Full SHA pins alone cannot stop a writer from replacing an approved pin with a malicious revision or adding an inline step. This is an illustrative scenario; execution depends on the repository's triggers, merge rules, and secret-access controls. GitHub's [secure-use guidance](https://docs.github.com/en/actions/reference/security/secure-use) describes the underlying workflow and credential risks.

With workflow-writing permission withheld, GitHub rejects that workflow-file update made with the stolen credential. `workflowup` makes this restriction practical: maintainers can keep action pins current through a separate, deliberate upgrade path while the routine dependency bot retains a smaller set of permissions.

### Keep routine upgrades within a smaller permission boundary

The intended division of responsibility is:

1. Renovate maintains ordinary dependencies with credentials that lack workflow-writing permission.
2. A maintainer runs `workflowup --dry-run`, then `workflowup`, in a trusted checkout. The tool reads upstream Git refs and edits local files; it does not push, open PRs, merge changes, or require remote write access. Private upstream repositories require read access through Git's authentication configuration.
3. The maintainer reviews the generated diff and submits it through an identity authorized to change workflows. Workflow-writing credentials stay outside the routine Renovate job.

This separates the permission to prepare an upgrade from the permission to publish workflow changes. Giving the routine dependency bot a workflow-writing token to run `workflowup` would undo that separation. The package supports the operating model; GitHub permissions and credential handling enforce the remote boundary.

Mandatory SHA pinning supplies the other half of the policy: an approved action reference must keep identifying the same upstream revision after review. Tags can move, so upgrades produce full commit SHAs with readable version comments, and Docker action references must use digests. A repeatable command keeps those immutable pins maintainable without broadening the dependency bot's authority. GitHub describes the rationale in its [secure-use guidance](https://docs.github.com/en/actions/reference/security/secure-use#using-third-party-actions).

This is one layer of protection. Source code, build scripts, and local composite actions can also affect CI execution, and may remain writable by the dependency bot. Branch protection, review, job permissions, and secret isolation still matter. SHA pinning does not audit upstream code or pin everything an action downloads; the exact scanning and failure guarantees are described below.

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
