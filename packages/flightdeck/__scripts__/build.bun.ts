#!/usr/bin/env bun

import { build } from "bun"

await build({
	entrypoints: [
		`./src/lib.ts`,
		`./src/flightdeck.bin.ts`,
		`./src/klaxon.bin.ts`,
	],
	outdir: `./dist`,
	packages: `external`,
	minify: true,
	sourcemap: `inline`,
	target: `node`,
})

import { writeFileSync } from "node:fs"

import { FLIGHTDECK_LNAV_FORMAT } from "flightdeck"

writeFileSync(
	`./dist/flightdeck_log.json`,
	JSON.stringify(
		{
			$schema: `https://lnav.org/schemas/format-v1.schema.json`,
			flightdeck_log: FLIGHTDECK_LNAV_FORMAT,
		},
		null,
		`\t`,
	),
)
