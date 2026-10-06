# break-check

command line tooling to detect breaking changes before you ship them

## can i use break-check?

break-check is a tool for projects where

1. releases must follow semantic versioning
2. source code and tests are kept in separate files
3. new releases are associated to git tags
4. you can run tests from the command line

**if that sounds like your project, read on!**

break-check distinguishes two kinds of tests:

1. Public tests record behavior consumers can rely on across releases. break-check restores their released versions so a proposed change cannot weaken an assertion alongside the implementation it checks.
2. Private tests cover implementation details, development diagnostics, and other behavior you want to verify without preserving it as a release commitment. They can detect real bugs too; they are not used as the historical compatibility contract.

Identify the public tests with a glob pattern and provide a command that runs those tests once against source. Build and current-test validation belong in independent jobs. A passing comparison means the selected released tests passed; its strength depends on the promises those tests actually protect.

## help

Run `break-check help` to show usage for the CLI, including the check options and `schema` command. Like `schema`, the `help` command skips configuration discovery; it works without required check options and even when `break-check.config.json` is malformed. It does not run checks or write schema files.

Use `break-check help` instead of the former `--help` or `-h` options. Configuration no longer controls help. The empty route and a configuration path still run checks; if your configuration file is named `help`, pass `./help` to select it explicitly.

## examples

### single-project repository

```bash
npx break-check \
  --tagPattern="refs/tags/my-library@" \
  --testPattern="tests/public/**/*" \
  --testCommand="npm run test:public" \
  --certifyCommand="false"
```

Run this from the project root. It restores files matching `tests/public/**/*` from the newest matching `my-library@<version>` release tag and runs your project's `npm run test:public` command. `certifyCommand="false"` leaves any detected break uncertified; replace it with a project command that validates your release plan when you add intentional-break certification.

### multi-project monorepo

```bash
npx break-check \
  --tagPattern="refs/tags/my-library@" \
  --testPattern="packages/my-library/tests/public/**/*" \
  --testCommand="cd packages/my-library && npm run test:public" \
  --certifyCommand="false"
```

Run this from the repository root. It restores the package's released public tests and runs its current public-test command. Patterns and commands are relative to the check's working directory; use `--baseDirname` if you want to run the check from a package directory instead.

In both examples, a failed test command remains uncertified and makes the CLI exit nonzero. Inspect the failure to distinguish a consumer regression from a build, runner, or setup problem.

Release tags may use `1.2.3`, `v1.2.3`, `package@1.2.3`, or `@scope/package@1.2.3`, including valid prerelease and build identifiers. The newest matching version is selected by semantic-version precedence; tags without a supported version are ignored.

## writing consumer contracts

Before preserving an assertion in a release, answer two questions: which consumer capability would its failure demonstrate is broken, and which harmless implementation changes should it continue to allow? A test named "public API" is not enough. Read every assertion as a promise you may need to keep after its original author and implementation have changed.

### choose the behavior deliberately

Test imports through the entrypoints consumers use. Resolve consumer import names to source in the test runner so compatibility checks do not require a package build or freeze internal source paths. Check distributable output and declarations separately in the build and type-check jobs.

Write focused scenarios for the capabilities you want to support. Include combinations that make resource independence observable: two fonts or images on one page, multiple registrations, or two distinct handles. Exercising a method once does not establish that its effect survives serialization or that it works alongside another instance.

The exported object model can itself be public API. If consumers construct a document graph or inspect a returned dictionary, protect the promised identities, values, and relationships. Follow construction through to independently observed output; a correct JavaScript representation does not establish that the library writes it faithfully.

Private tests remain useful for implementation-specific assertions and visual baselines. An exact screenshot or historical byte sequence belongs in the public contract only when preserving that exact output is an intentional consumer promise. Same-run comparisons of repeated and equivalent inputs can protect determinism without requiring identical bytes across releases.

### make the expected result independent

Derive expected values from the scenario's requested behavior, documented semantics, or an independent observer. Comparing two paths through the current implementation allows both to become identically wrong.

For example, reading the output of both a document builder and a standalone serializer and comparing the results will not catch both producing a 1×1 page. Assert the requested dimensions directly. Check document identifiers, font selection, text origins, and binary values when those are part of the scenario.

Choose inputs that make omissions visible. Request a nondefault stroke color; black cannot distinguish a working setter from a missing setter when black is already the default. To test visual regression detection, compare documents with different painted content but identical geometry and rendering options. Changing a background option may change a manifest and report a mismatch even if pixel comparison is disabled. Require meaningful page differences as well as the failure result.

Use malformed descriptions to exercise rejection by the exported validator and serializer, not just checks in a higher-level builder. A reader successfully opening a document may also conceal a serialization defect if it repairs malformed structures. Verify the relevant structural property independently when validity is part of the promise.

### avoid accidental commitments

Keep setup inline and specific to each scenario, or use a narrowly named helper that explains exactly what it constructs. A generic shared "example document" can make unrelated tests depend on arbitrary page shapes and metadata. Include any fixture or helper that determines historical expectations in the restore pattern.

Preserve outcomes at the point consumers need them. If invalid input only needs to be rejected before serialization succeeds, encompass construction and serialization in the throwing assertion. Requiring rejection at a particular intermediate call is a stronger promise; make it only deliberately.

Inspect helpers for constraints too. A baseline-preservation helper should collect files recursively rather than assume the artifact directory is flat. A decoder should accept equivalent encodings rather than require the current serializer's spacing, dictionary order, or hexadecimal capitalization. Allow generated resource names and allocation order to vary unless consumers actually depend on them.

### preserve the observation code

Released assertions need trustworthy readers. If today's writer and today's observation helper can change together, an unchanged historical assertion can still become weaker. Include the helper's source in `testPattern` when its behavior determines the meaning of those assertions.

Mondrian publishes its independent inspection tools through its testing entrypoint and restores their source alongside the public tests:

```json
{
	"tagPattern": "refs/tags/mondrian\\.pdf@",
	"testPattern": "{tests/public,src/testing/inspection}/**/*",
	"testCommand": "pnpm test:public",
	"certifyCommand": "false"
}
```

This illustrates the restore boundary; `test:public` is a project-provided command that only runs its public suite against source. Consumer type checks and builds have separate commands. `false` keeps detected breaks uncertified until the project supplies its release-plan check.

Match the assertions and observation code, and leave the implementation they are meant to evaluate outside that boundary. When an observer also ships as a library feature, its restored implementation is trusted test infrastructure for this comparison; verify its current implementation separately too. Execute observation source directly after restoration so historical readers run without a build.

break-check restores matched Git files, not installed dependencies. A shared package manifest and workspace lockfile keep setup simple, but dependency upgrades must keep restored readers runnable. If a reader needs its own dependency versions, include that dependency description in the restore boundary and make your test command install it. Merely matching a lockfile does not perform an installation. Protect runner configuration and other support files when they determine how historical assertions execute.

### check that the tests can fail for the right reason

Before releasing the suite, deliberately introduce representative regressions in a disposable checkout. Run the public command against each mutation and inspect the failure, then restore the checkout. Require the intended assertion or consumer-import/type check to fail; an unrelated build, setup, or test failure proves nothing about that contract.

| Mutation                                          | Contract that should detect it                           |
| ------------------------------------------------- | -------------------------------------------------------- |
| Remove an exported function or declaration        | Consumer imports and type checking                       |
| Ignore a requested position, color, or identifier | Independent expected output values                       |
| Give distinct resources the same generated name   | Multiple distinguishable resources used together         |
| Return success for every validation request       | Malformed input requiring diagnostics and rejection      |
| Disable page-difference detection                 | Changed painted content with identical rendering options |
| Drop byte-keyed entries during serialization      | Independently decoded names and values                   |

Test the other direction too: harmless refactors should pass. Try moving an internal source entrypoint while preserving package exports, rejecting invalid input earlier or later within the promised boundary, nesting artifact files, or switching between equivalent encodings. This exposes accidental commitments before they become historical requirements.

Also verify the restoration mechanism once: change a current observation helper so the public command fails, commit the probe in a disposable checkout, and compare against a known release containing the original helper. Check that the historical helper is restored and used, and that the original working copy returns afterward. Use a local-only release for experiments rather than publishing a probe tag.

### run current contracts and historical contracts

Run the current suite in a parallel test job so newly added contracts are checked independently. Let the CLI run only the released suite against source through `testCommand`. Configure the command to fail when it selects no tests and avoid cached test results that can bypass execution of restored files. Builds and type checks have separate commands and jobs. Tests should run once and terminate.

Run the check from a clean checkout with access to `origin` and release tags. An initial release without matched public tests provides no baseline: preserve the CLI's inconclusive result until a release includes them. A missing baseline is not evidence of compatibility.

When the job fails, identify the phase before deciding on a breaking release. A failed current test, incompatible runner types, a build problem, a missing baseline, and a released assertion detecting a consumer regression require different responses. Certification should validate an intentional breaking-release plan after that review; using a successful certification command to bypass an unexplained infrastructure failure does not establish compatibility.

### case study: mondrian.pdf

[Mondrian's adoption PR](https://github.com/jeremybanka/mondrian/pull/108) separated consumer contracts from implementation tests and exact visual proofs. Independent reviews introduced mutations that still passed the proposed public suite, including ignored positions and identifiers, collapsed resources, and disabled visual differences. Strengthening the corresponding scenarios made those regressions observable. Refactor probes also removed unintended commitments to rejection timing and flat artifact directories.

An October 5, 2026 audit examined 237 subsequent Break Check jobs: 186 passed, 48 failed, and 3 were cancelled. Of the failures, 13 were the initial missing-release-baseline result; the other 35 stopped in current-suite type checking with mismatched Vitest dependencies before historical comparison ran. After the baseline was established, the default branch had 64 passing checks and no failing checks. No failed job in that audit was traced to an arbitrary PDF expectation. See the [workflow history](https://github.com/jeremybanka/mondrian/actions/workflows/test.yml), a [baseline failure](https://github.com/jeremybanka/mondrian/actions/runs/35064496994/job/104691685448), and a [runner-alignment failure](https://github.com/jeremybanka/mondrian/actions/runs/36281497246/job/108514056194).

The contracts continued to pass through [PDFium changes](https://github.com/jeremybanka/mondrian/actions/runs/35280593318/job/105401343541) and an [aligned Vite Plus upgrade](https://github.com/jeremybanka/mondrian/actions/runs/36543626809/job/109324668309). That is evidence for the chosen boundaries over the audited changes, not a claim that the suite covers every possible consumer regression.

## git environment

break-check uses simple-git v4, which filters inherited `GIT_*` environment variables and certain other Git-related variables, including `SSH_ASKPASS`, from its Git subprocesses. Environment-based settings such as `GIT_SSH_COMMAND`, `GIT_ASKPASS`, and `GIT_CONFIG_*` no longer configure tag discovery, fetching, or file restoration. Configure authentication and Git behavior through Git configuration files, SSH configuration, or an SSH agent instead. This filtering applies to break-check's Git operations; test and certification commands still inherit the normal process environment.

## parallel checks and file restoration

Checks with disjoint public test paths can run their test and certification commands in parallel, in their original working directories. break-check coordinates Git setup and cleanup with a short-lived lock and records each running check's test paths. The clean-repository check ignores only the paths owned by active checks; unrelated uncommitted changes still prevent a new check from starting. Checks with overlapping test paths are rejected before replacing files. Remote tag discovery runs outside this lock, and fetches use a separate lock in the common Git directory. Cleanup waits for file-restoration access instead of giving up when a setup timeout expires.

Released tests are loaded with `git restore --worktree`. After testing and certification, including failures, break-check restores only those paths to their starting commit and removes tests that existed only in the release. The Git index and existing stashes are preserved. Unrelated files, command outputs, and changes made by other packages are left in place. There is no repository or dependency copy. Commands that themselves modify shared files or Git state still need their own coordination.

If a process is forcibly interrupted or restoration fails, break-check retains recovery information under `break-check/` in the worktree's Git directory (`git rev-parse --absolute-git-dir`). After confirming the process has stopped, restore each recorded path from the recorded `head` commit, remove any recorded paths absent from that commit, and remove the record. An interrupted setup or cleanup can also leave the `break-check/lock` directory; remove it only after confirming no setup or cleanup is still running. An interrupted fetch can leave `break-check-fetch.lock` in the common Git directory; remove it only after confirming no fetch is still running.

## options

<!--gen-->
<!--cli-options HASH-->
<table>
  <tr>
    <th>option</th>
    <th>shorthand</th>
    <th>required</th>
    <th>description</th>
    <th>example</th>
  </tr>
  <tr>
    <td><code>--tagPattern</code></td>
    <td><code>-p</code></td>
    <td></td>
    <td>String which, if found in a git tag, will be considered a release tag for your library.</td>
    <td><code>--tagPattern="my-library"</code></td>
  </tr>
  <tr>
    <td><code>--testPattern</code></td>
    <td><code>-t</code></td>
    <td>✔</td>
    <td>Glob pattern to identify files containing public tests.</td>
    <td><code>--testPattern="*__public.test.ts"</code></td>
  </tr>
  <tr>
    <td><code>--testCommand</code></td>
    <td><code>-c</code></td>
    <td>✔</td>
    <td>Command to run to run the public tests.</td>
    <td><code>--testCommand="npm run test"</code></td>
  </tr>
  <tr>
    <td><code>--certifyCommand</code></td>
    <td><code>-C</code></td>
    <td></td>
    <td>Command to run to certify that breaking changes have been detected.</td>
    <td><code>--certifyCommand="grep -q '"my-library": major' $(find ${DIR_PATH}/.changesets -type f) && exit 0 || exit 1"</code></td>
  </tr>
  <tr>
    <td><code>--baseDirname</code></td>
    <td><code>-b</code></td>
    <td></td>
    <td>Directory in which to run the tests and certify the breaking changes.</td>
    <td><code>--baseDirname="."</code></td>
</table>
<!--gen-->

## cli completion

With `break-check` installed on PATH, run `break-check completion install bash` to install Bash completion. Replace `bash` with `zsh`, `fish`, `nushell`, or `carapace` for the other supported integrations. Installation uses the shell's existing completion setup and does not edit shell profiles; open a new shell afterward. `break-check completion bash` prints the integration for manual installation. See [Comline's shell setup requirements](../comline/README.md#shell-integrations).

Completion suggests commands, option names, config file paths, and directories for `--base-dir` and `schema --out-dir`. It works without a valid config file or required option values and does not run checks. Singleton options disappear from suggestions after use; parsing behavior is unchanged. The completion transport reserves its management and protocol command names; use an explicit path such as `./completion` for a config file whose name collides with a reserved command.

## cli option aliases and warnings

These aliases work alongside the original option names. Configuration file keys remain unchanged.

| Original option             | Aliases                        |
| --------------------------- | ------------------------------ |
| `--tagPattern`              | `--tag-pattern`                |
| `--testPattern`             | `--test-pattern`, `--pattern`  |
| `--testCommand`             | `--test-command`               |
| `--certifyCommand`          | `--certify-command`            |
| `--baseDirname`             | `--base-dir`, `--base-dirname` |
| `--outdir` (schema command) | `--out-dir`                    |

After successful parsing, break-check warns on stderr about unknown options and options that do not apply to the selected command. Warnings appear before check output is captured and do not change the command's exit status.
