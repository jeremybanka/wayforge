#!/usr/bin/env bun

import { build } from "bun"

await build({
	outdir: `./bin`,
	entrypoints: [
		`./src/frontend.bun.ts`,
		`./src/backend.bun.ts`,
		`./src/backend.worker.bug-rangers.bun.ts`,
		`./src/backend.worker.tribunal.bun.ts`,
	],
	external: [`react`, `react-dom`],
	packages: `bundle`,
	target: `bun`,
})
await build({
	outdir: `./bin`,
	entrypoints: [
		`./__scripts__/setup-db.bun.ts`,
		`./__scripts__/interactive-db.bun.ts`,
	],
	minify: false,
	target: `bun`,
})
