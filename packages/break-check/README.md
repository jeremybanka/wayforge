# break-check

command line tooling to detect breaking changes before you ship them

## can i use break-check?

break check is a tool for projects where

1. releases must follow semantic versioning
2. source code and tests are kept in separate files
3. new releases are associated to git tags
4. you can run tests from the command line

**if that sounds like your project, read on!**

break check introduces the following requirements/model for your project:

1. public tests can be differentiated from private tests
   - public tests specify the public API of your project
   - public tests, if changed, may indicate that breaking changes are present
   - private tests specify your project's internals and implementation details, perhaps for documentation or coverage purposes
   - private tests, if changed, cannot indicate breaking changes
2. files containing public tests can be identified by a glob pattern
3. you must have a command-line command that runs only the public tests in your test suite

## help

Run `break-check help` to show usage for the CLI, including the check options and `schema` command. Like `schema`, the `help` command skips configuration discovery; it works without required check options and even when `break-check.config.json` is malformed. It does not run checks or write schema files.

Use `break-check help` instead of the former `--help` or `-h` options. Configuration no longer controls help. The empty route and a configuration path still run checks; if your configuration file is named `help`, pass `./help` to select it explicitly.

## example

### single-project repository

```bash
npx break-check 
  --testPattern="*__public.test.ts" 
  --testCommand="npm run test"
```

this command will check out all files matching the pattern `*__public.test.ts` from the last release tag that contains the string `my-library`, and then run `npm run test`

if the tests fail, break-check will exit with a non-zero status code, indicating that you have breaking changes in your project at the current commit

### multi-project monorepo

```bash
npx break-check 
  --tagPattern="my-library" 
  --testPattern="./packages/my-library/__tests__/**/*__public.test.ts" 
  --testCommand="cd packages/my-library && npm run test"
```

this command will check out all files matching the pattern `*__public.test.ts` from the last release tag that contains the string `my-library`, and then run `cd packages/my-library && npm run test`

if the tests fail, break-check will exit with a non-zero status code, indicating that you have breaking changes in your project at the current commit

Release tags may use `1.2.3`, `v1.2.3`, `package@1.2.3`, or `@scope/package@1.2.3`, including valid prerelease and build identifiers. The newest matching version is selected by semantic-version precedence; tags without a supported version are ignored.

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
