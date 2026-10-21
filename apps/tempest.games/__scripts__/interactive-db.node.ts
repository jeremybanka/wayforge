#!/usr/bin/env node

import { spawn } from "node:child_process"
import { resolve } from "node:path"

const applicationRoot = resolve(import.meta.dirname, `..`)
const drizzleConfig = resolve(applicationRoot, `drizzle.config.ts`)
const child = spawn(
	`pnpm`,
	[`exec`, `drizzle-kit`, `studio`, `--config`, drizzleConfig],
	{
		cwd: applicationRoot,
		stdio: `inherit`,
	},
)
child.on(`error`, (error) => {
	console.error(error)
	process.exitCode = 1
})
child.on(`exit`, (code) => {
	process.exitCode = code ?? 1
})
