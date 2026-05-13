# Lima Dev Sandbox Plan

## Why

We have been hardening CI because modern dependency updates are an arbitrary code execution surface, not just a maintenance chore.

That same logic applies locally:

- `pnpm install`, `build`, `test`, and `dev` all execute third-party code
- even reputable packages and maintainers can ship compromised updates
- the goal is not to prove packages are safe, but to reduce the blast radius when one is not

For local development, the practical objective is:

- keep personal macOS apps and identity on the host
- move dependency execution into a local sandbox
- preserve a workflow that is still comfortable enough to use every day

## Proposed Shape

Use a local Lima Linux VM as the execution boundary for risky projects.

- macOS host stays the home for:
  - editor
  - terminal app
  - Codex
  - browser
  - personal accounts and secrets
- Lima guest becomes the place where we run:
  - `pnpm install`
  - `pnpm test`
  - `pnpm build`
  - `pnpm dev`

The preferred workflow is:

- clone the repo inside the Lima VM
- connect from host tools into the VM over SSH / remote editing
- expose dev server ports back to the host browser

This is preferred over host bind-mounts because it is usually better for both security and performance.

## Ground Rules

- no personal browser session, password manager, or cloud credentials inside the VM
- no SSH agent forwarding by default
- do not mount the whole home directory into the VM
- treat the VM as disposable infrastructure for code execution, not as a second personal workstation

## Next Steps

In the next session:

1. Install and configure Lima on macOS.
2. Create a Linux ARM guest using the `vz` backend.
3. Provision Node, pnpm, and basic dev tooling inside the guest.
4. Set up SSH / remote-editor workflow from macOS into the guest.
5. Validate one real repo by running install, test, build, and dev inside the VM.
