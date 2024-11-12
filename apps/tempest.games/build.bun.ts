#!/usr/bin/env bun

import { build } from "bun"

await build({
	entrypoints: [
		`./src/frontend.bun.ts`,
		`./src/backend.bun.ts`,
		`./src/backend.worker.game.bun.ts`,
		`./src/backend.worker.tribunal.bun.ts`,
	],
	outdir: `./bin`,
	packages: `bundle`,
	minify: true,
	target: `bun`,
})
await build({
	entrypoints: [
		`./__scripts__/setup-db.bun.ts`,
		`./__scripts__/interactive-db.bun.ts`,
	],
	outdir: `./bin`,
	minify: false,
	target: `bun`,
})
