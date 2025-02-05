#!/usr/bin/env bun

import { build } from "bun"

await Promise.all([
	build({
		entrypoints: [`src/index.ts`],
		outdir: `./dist`,
		target: `node`,
	}),
	build({
		entrypoints: [
			`__scripts__/varmint-track.node.ts`,
			`__scripts__/varmint-clean.node.ts`,
		],
		outdir: `./bin`,
		target: `node`,
		packages: `external`,
	}),
])
