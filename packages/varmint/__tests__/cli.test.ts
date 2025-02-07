import { spawn } from "node:child_process"

import tmp from "tmp"
import * as Yalc from "yalc"

let tmpDir: tmp.DirResult

beforeAll(() => {
	tmpDir = tmp.dirSync({ unsafeCleanup: true })
	console.log(`created tmpDir`)
})

afterAll(() => {
	tmpDir.removeCallback()
	console.log(`removed tmpDir`)
})

describe(`cli`, () => {
	it(`builds and runs`, async () => {
		const build = spawn(`bun`, [`build.bun.ts`], { stdio: `inherit` })
		const buildCode = await new Promise((resolve) => build.on(`exit`, resolve))
		expect(buildCode).toBe(0)
		await Yalc.publishPackage({ workingDir: `.`, workspaceResolve: true })
		process.chdir(tmpDir.name)
		const projectInit = spawn(`bun`, [`init`], { stdio: `inherit` })
		await new Promise((resolve) => projectInit.on(`exit`, resolve))
		expect(projectInit.exitCode).toBe(0)
		await Yalc.addPackages([`varmint`], { workingDir: `.` })
		const install = spawn(`bun`, [`install`], { stdio: `inherit` })
		await new Promise((resolve) => install.on(`exit`, resolve))
		expect(install.exitCode).toBe(0)

		const track = spawn(
			`./node_modules/varmint/dist/varmint.bin.js`,
			[`--`, `track`],
			{ stdio: `inherit` },
		)
		const trackCode = await new Promise((resolve) => track.on(`exit`, resolve))
		expect(trackCode).toBe(0)

		const clean = spawn(
			`./node_modules/varmint/dist/varmint.bin.js`,
			[`--ci-flag=CI`, `--`, `clean`],
			{ stdio: `inherit`, env: { ...process.env, CI: `true` } },
		)
		const cleanCode = await new Promise((resolve) => clean.on(`exit`, resolve))
		expect(cleanCode).toBe(0)
	}, 10_000)
})
