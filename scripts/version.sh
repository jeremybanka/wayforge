#!/usr/bin/env bash

set -euo pipefail

bun changeset version
pnpm install --no-frozen-lockfile
pnpm release:hooks
pnpm fmt
