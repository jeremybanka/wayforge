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