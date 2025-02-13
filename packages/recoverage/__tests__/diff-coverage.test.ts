import { spawn } from "node:child_process"
import { readdirSync, readFileSync } from "node:fs"
import { copyFile, readdir } from "node:fs/promises"
import * as path from "node:path"

import simpleGit from "simple-git"
import tmp from "tmp"
import * as Yalc from "yalc"

beforeAll(async () => {
	const build = spawn(`pnpm`, [`build`], {
		stdio: `inherit`,
		env: { ...process.env, FORCE_COLOR: `1` },
	})
	const buildCode = await new Promise((resolve) => build.on(`exit`, resolve))
	expect(buildCode).toBe(0)
	await Yalc.publishPackage({ workingDir: `.`, workspaceResolve: true })
})

let phase = 0
let tmpDir: tmp.DirResult

beforeEach(() => {
	phase = 0
	tmpDir = tmp.dirSync({ unsafeCleanup: true })
	process.chdir(tmpDir.name)
	console.log(`created tmpDir ${tmpDir.name}`)
})

afterEach(() => {
	tmpDir.removeCallback()
	console.log(`removed tmpDir ${tmpDir.name}`)
})

async function loadSample(packageName: string) {
	await readdir(path.resolve(__dirname, packageName)).then((fileNames) =>
		Promise.all(
			fileNames.map(async (fileName) => {
				const isInitial = phase === 0 && !fileName.includes(`$`)
				const isPhase = fileName.includes(`$${phase}`)
				const shouldCopy = isInitial || isPhase
				if (shouldCopy) {
					await copyFile(
						path.resolve(__dirname, packageName, fileName),
						path.resolve(tmpDir.name, fileName),
					)
					console.log(`copied ${fileName}`)
				}
			}),
		),
	)
	if (phase === 0) {
		await Yalc.addPackages([`recoverage`], { workingDir: `.` })

		const install = spawn(`bun`, [`install`], {
			stdio: `inherit`,

			env: { ...process.env, FORCE_COLOR: `1` },
		})
		await new Promise((resolve) => install.on(`exit`, resolve))
		expect(install.exitCode).toBe(0)
	}
	phase++
}

describe(`recoverage`, () => {
	it(`approves a coverage improvement [sample-package-01]`, async () => {
		await loadSample(`sample-package-01`)

		const git = simpleGit(tmpDir.name)
		await git.init().add(`.`).commit(`initial commit`)

		const test = spawn(`bun`, [`test:coverage`], {
			stdio: `inherit`,
			env: { ...process.env, FORCE_COLOR: `1` },
		})
		await new Promise((resolve) => test.on(`exit`, resolve))
		expect(test.exitCode).toBe(0)

		const coverage = spawn(`bun`, [`coverage:status`], {
			stdio: `inherit`,
			env: { ...process.env, FORCE_COLOR: `1` },
		})
		await new Promise((resolve) => coverage.on(`exit`, resolve))
		expect(coverage.exitCode).toBe(0)

		await git.checkout([`-b`, `test`])

		await loadSample(`sample-package-01`)

		const test2 = spawn(`bun`, [`test:coverage`], {
			stdio: `inherit`,
			env: { ...process.env, FORCE_COLOR: `1` },
		})
		await new Promise((resolve) => test2.on(`exit`, resolve))
		expect(test2.exitCode).toBe(0)

		const coverage2 = spawn(`bun`, [`coverage:status`], {
			stdio: `inherit`,
			env: { ...process.env, FORCE_COLOR: `1` },
		})
		await new Promise((resolve) => coverage2.on(`exit`, resolve))
		expect(coverage2.exitCode).toBe(0)
	}, 20_000)

	it(`fails a coverage decrease [sample-package-02]`, async () => {
		await loadSample(`sample-package-02`)

		const git = simpleGit(tmpDir.name)
		await git.init().add(`.`).commit(`initial commit`)

		const test = spawn(`bun`, [`test:coverage`], {
			stdio: `inherit`,
			env: { ...process.env, FORCE_COLOR: `1` },
		})
		await new Promise((resolve) => test.on(`exit`, resolve))
		expect(test.exitCode).toBe(0)

		const coverage = spawn(`bun`, [`coverage:status`], {
			stdio: `inherit`,
			env: { ...process.env, FORCE_COLOR: `1` },
		})
		await new Promise((resolve) => coverage.on(`exit`, resolve))
		expect(coverage.exitCode).toBe(0)

		await loadSample(`sample-package-02`)

		const test2 = spawn(`bun`, [`test:coverage`], {
			stdio: `inherit`,
			env: { ...process.env, FORCE_COLOR: `1` },
		})
		await new Promise((resolve) => test2.on(`exit`, resolve))
		expect(test2.exitCode).toBe(0)

		const coverage2 = spawn(`bun`, [`coverage:status`], {
			stdio: `inherit`,
			env: { ...process.env, FORCE_COLOR: `1` },
		})
		await new Promise((resolve) => coverage2.on(`exit`, resolve))
		expect(coverage2.exitCode).toBe(1)
	}, 20_000)
})
