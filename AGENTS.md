# Repository guidance

## Dependency release age

Packages authored by jeremybanka are exempt from minimum release age requirements at every version, including transitive dependencies. Keep their package names aligned between `minimumReleaseAgeExclude` in `pnpm-workspace.yaml` and the corresponding npm package rule in `renovate.json`. When adding a new first-party package, update both lists; do not restrict these exemptions to specific versions.

## Changesets

Add or update a changeset whenever a change affects the functionality of a published package. Changesets should consolidate the consumer-visible differences between the current ref and the last release tag for that package.

Update existing changesets to describe the finished consumer-visible behavior as unshipped features evolve. A shipped feature is expected to work; defects fixed during its development are immaterial to consumers and should not be mentioned in changesets.

For packages below version 1.0.0:

- use a patch bump for non-breaking changes, including features and fixes
- use a minor bump for breaking changes

## Markdown

Do not manually wrap Markdown prose at a fixed line width. Keep each paragraph and each list item's prose on a single source line. Preserve structural line breaks for headings, lists, tables, and code blocks.

## Repository commands

Use the canonical command names in `docs/commands.md`: `fmt` writes formatting, `check` aggregates `check:*` validators, and `test` runs once. Coverage commands use the `cov` prefix where implemented. Keep CI and documentation references aligned when changing commands.

## Release compatibility

- Run released public contracts against the tested package's source with break-check; do not build that package itself or run the current suite as a compatibility preflight. Upstream dependency builds, such as Turbo's `^build`, are allowed.
- Run current tests, the tested package's build, and type checks independently in parallel CI jobs. Public-test commands run tests only; individual public contracts may build disposable fixtures when the build or package output is the behavior being verified.
- Disable compatibility-task caching and preserve the repository's intentional-break certification policy.
