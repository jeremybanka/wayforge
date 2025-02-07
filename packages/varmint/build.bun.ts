#!/usr/bin/env bun

import { build } from "bun"

await Promise.all([
	build({
		entrypoints: [`src/index.ts`],
		outdir: `./dist`,
		target: `node`,
		packages: `external`,
	}),
	build({
		entrypoints: [`__scripts__/varmint.node.ts`],
		outdir: `./bin`,
		target: `node`,
		packages: `external`,
	}),
])
