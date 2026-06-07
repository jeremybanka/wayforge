# Atom.io Fork Transition Notes

This is a working checklist for eventually splitting Atom.io out of Wayforge,
likely taking `atom.io`, `atom.io.fyi`, templates, and the `create-*` package
with it. `treetrunks` is a possible companion package because of how well it
fits Atom.io router work, but that boundary is still undecided.

## Initial Shortlist

- Cull the Atom.io fork of things that do not belong there.
- Cull Wayforge of Atom.io-specific things.
- Update npm publishing to publish from the new repo.
- Add secrets to the new repo.

## Repo Boundary

- Decide exact package ownership: `atom.io`, `atom.io.fyi`, templates,
  `create-*`, possibly `treetrunks`, and any examples, docs, or tests that
  currently imply Atom ownership.
- Identify shared utilities that should stay in Wayforge, move with Atom.io, or
  become neutral packages.
- Preserve git history if release archaeology and blame matter, using
  `git filter-repo` or an equivalent path-preserving split.

## Package Publishing

- Update `package.json` `repository`, `homepage`, and `bugs` fields.
- Update npm provenance, trusted publishing, package access, and `publishConfig`.
- Confirm package names, scopes, dist-tags, and prerelease strategy.
- Decide whether old packages get deprecation notices, forwarding docs, or a
  temporary period of continued publishing from Wayforge.

## CI/CD

- Recreate workflows in the new repo: test, lint, build, release, and docs
  deploy.
- Update branch protection, required checks, release permissions, and npm token
  or trusted publisher bindings.
- Make sure generated templates still test against the published package or the
  local workspace as intended.

## Docs And Website

- Update README links, badges, install commands, repo URLs, issue links,
  examples, and playground links.
- Decide where `atom.io.fyi` deploys from and update DNS, CDN, and deployment
  secrets.
- Add migration notes explaining that Atom.io moved out of Wayforge for
  contributors and users.

## Dependency Graph

- Audit internal imports and workspace references.
- Replace monorepo-relative assumptions in templates, scripts, test fixtures,
  examples, and docs.
- Decide whether Wayforge depends on the new Atom.io repo or package, or whether
  Atom.io becomes fully independent.

## Issues And Community

- Move or recreate relevant GitHub issues, discussions, and project items.
- Add archive or redirect notices where appropriate.
- Update CODEOWNERS, contributing docs, security policy, license files, and
  funding metadata.

## Release Continuity

- Cut one final pre-split release or tag in Wayforge.
- Tag the initial fork point in both repos.
- Prepare a first independent Atom.io release to prove publishing, docs, CI, and
  templates all work from the new location.

## Secrets And Access

- Add npm secrets, deployment tokens, GitHub Actions permissions, package
  provenance settings, analytics, domain/DNS access, docs hosting credentials,
  and any webhook integrations.
- Add maintainers and admins explicitly instead of relying on org defaults.

## Cleanup In Wayforge

- Remove Atom.io-specific scripts, examples, docs, tests, templates, and
  workspace entries.
- Update root docs so Wayforge's identity is clear without Atom.io.
- Make sure CI no longer expects removed packages.

## Likely Gotcha

Release automation plus provenance is easy to underestimate. The code move is
visible; npm publishing from a new repo often fails later because trusted
publishing, provenance, repo metadata, or workflow permissions still point at
the old home.
