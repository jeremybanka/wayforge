#!/usr/bin/env bash

set -euo pipefail

bun changeset version
pnpm install --no-frozen-lockfile
bun version
bun fmt:fix
