#!/usr/bin/env bun

import { write } from "bun"

import { FLIGHTDECK_LNAV_FORMAT } from "../src/lib.ts"

await write(
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
