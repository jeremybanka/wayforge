#!/usr/bin/env bun

import { build } from "bun"

await Promise.all([
	build({
		entrypoints: [`src/index.ts`, `src/varmint.bin.ts`],
		outdir: `./dist`,
		target: `node`,
		packages: `external`,
		splitting: true,
	}),
])
