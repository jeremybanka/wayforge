import { execSync } from "node:child_process"
import { resolve } from "node:path"

import tmp from "tmp"

import { ServiceManager } from "../src/lib"

const testDirname = import.meta.dirname

let serviceManager: ServiceManager
let tmpDir: tmp.DirResult

beforeEach(() => {
	vitest.spyOn(console, `error`)
	vitest.spyOn(console, `warn`)
	vitest.spyOn(console, `log`)
	tmpDir = tmp.dirSync({ unsafeCleanup: true })
	tmp.setGracefulCleanup()
})

afterEach(() => {
	serviceManager.stopService()
})

describe(`ServiceManager`, () => {
	it(`should start a service`, async () => {
		serviceManager = new ServiceManager(
			`sample/repo`,
			`my-app`,
			[`./app`],
			tmpDir.name,
			function fetchLatestRelease(destination) {
				execSync(
					`bun build ${testDirname}/fixtures/app.ts --bundle --outfile ${resolve(destination, `app`)}`,
				)
			},
		)
		await serviceManager.alive
		const data = await fetch(`http://localhost:4444/`)
	}, 30000)
})
