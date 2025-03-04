#!/usr/bin/env bun

import path from "node:path"

import { file, write } from "bun"

const htmxMinJs = await file(`node_modules/htmx.org/dist/htmx.min.js`).text()

await write(
	path.join(import.meta.dir, `../src/scripts.gen.ts`),
	`/* eslint-disable */\nexport const htmxMinJS = ${JSON.stringify(
		JSON.stringify(htmxMinJs),
	)};\n`,
)
