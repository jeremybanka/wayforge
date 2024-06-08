import "./memory-logging-worker"

import { spawn } from "node:child_process"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

import { ATOM_IO_ROOT } from "~/packages/atom.io/__scripts__/constants"

describe(`log memory usage`, () => {
	it(`should log memory usage`, async () => {
		const workerPath = join(__dirname, `memory-logging-worker.ts`)
		const worker = spawn(
			`tsx`,
			[
				`--max-old-space-size=1024`,
				`--tsconfig=${join(ATOM_IO_ROOT, `tsconfig.json`)}`,
				workerPath,
			],
			{
				env: {
					...process.env,
					WORKER: `true`,
				},
			},
		)

		const promise = new Promise<string>((resolve) => {
			worker.stdout.on(`data`, (data) => {
				const output = data.toString()
				resolve(output)
			})
		})
		expect(await promise).toBe(``)
	})
})
