#!/usr/bin/env bash
set +e

label="${1:-probe}"
shift || true

echo "==== ci-bin-probe: ${label} ===="
echo "pwd=$(pwd)"
echo "node=$(command -v node 2>/dev/null)"
node --version 2>/dev/null
echo "pnpm=$(command -v pnpm 2>/dev/null)"
pnpm --version 2>/dev/null
echo "PATH=${PATH}"

for item in "$@"; do
	echo "-- ${item}"
	if command -v "${item}" >/dev/null 2>&1; then
		echo "command=$(command -v "${item}")"
	fi
	ls -la "${item}" 2>/dev/null
	readlink "${item}" 2>/dev/null
	ls -la "node_modules/.bin/${item}" 2>/dev/null
	sed -n '1,80p' "node_modules/.bin/${item}" 2>/dev/null
done

echo "-- package node_modules"
ls -la node_modules 2>/dev/null
echo "-- relevant links"
ls -la \
	node_modules/@typescript 2>/dev/null
ls -la \
	node_modules/@typescript/native-preview 2>/dev/null
ls -la \
	node_modules/@typescript/native-preview/bin 2>/dev/null
ls -la \
	node_modules/@typescript/native-preview/bin/tsgo.js 2>/dev/null
ls -la \
	node_modules/vitest 2>/dev/null
ls -la \
	node_modules/vitest/vitest.mjs 2>/dev/null
ls -la \
	node_modules/oxlint 2>/dev/null
ls -la \
	node_modules/oxlint/bin 2>/dev/null
echo "==== end ci-bin-probe: ${label} ===="
exit 0
