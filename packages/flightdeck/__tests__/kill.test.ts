import { execSync, spawn } from "node:child_process"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { resolve } from "node:path"

import { FlightDeck } from "../src/flightdeck.lib.ts"

const testDirname = import.meta.dirname

let tmpDir: string

beforeEach(() => {
	vitest.spyOn(console, `error`)
	vitest.spyOn(console, `warn`)
	vitest.spyOn(console, `log`)
	tmpDir = mkdtempSync(resolve(tmpdir(), `flightdeck-`))
})

afterEach(() => {
	rmSync(tmpDir, { recursive: true, force: true })
})

describe(`FlightDeck`, () => {
	it(`should kill a flightdeck instance in the background`, async () => {
		const childProcess = spawn(
			resolve(testDirname, `fixtures`, `flightdeck-proc.node.ts`),
			[tmpDir, testDirname],
		)

		childProcess.stderr.on(`data`, (data) => {
			console.log(`stderr`, data.toString())
		})
		onTestFinished(() => {
			childProcess.kill()
		})
		await new Promise<void>((pass) => {
			childProcess.stdout.on(`data`, (data) => {
				console.log(`stdout`, data.toString())

				if (data.toString().includes(`flightdeck is live`)) {
					pass()
				}
			})
		})

		await FlightDeck.kill(tmpDir, `my-app`)

		try {
			execSync(`lsof -ti :7777`)
			throw new Error(`lsof 7777 still running`)
		} catch (_) {}
		try {
			execSync(`lsof -ti :8888`)
			throw new Error(`lsof 8888 still running`)
		} catch (_) {}
		try {
			execSync(`lsof -ti :9999`)
			throw new Error(`lsof 9999 still running`)
		} catch (_) {}
	})
})
