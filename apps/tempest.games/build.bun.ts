#!/usr/bin/env bun

import { rename } from "node:fs/promises"

import { build } from "bun"

await build({
	outdir: `./bin`,
	entrypoints: [
		`./src/frontend.bun.ts`,
		`./src/backend.bun.ts`,
		`./src/backend.worker.bug-rangers.bun.ts`,
	],
	external: [`react`, `react-dom`],
	packages: `bundle`,
	target: `bun`,
})
await build({
	outdir: `./bin`,
	naming: `[name].js`,
	entrypoints: [
		`./__scripts__/setup-db.node.ts`,
		`./__scripts__/interactive-db.node.ts`,
	],
	minify: false,
	target: `node`,
})

// Preserve the installed command paths while running DB tooling with Node.
for (const name of [`setup-db`, `interactive-db`]) {
	await rename(`./bin/${name}.node.js`, `./bin/${name}.bun.js`)
}
