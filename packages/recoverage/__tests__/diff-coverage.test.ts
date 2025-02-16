import type { ChildProcess } from "node:child_process"
import { spawn } from "node:child_process"
import { copyFile, readdir, rename } from "node:fs/promises"
import * as path from "node:path"

import type { SimpleGit } from "simple-git"
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
	await Yalc.publishPackage({ workingDir: `.` })
	await Yalc.publishPackage({ workingDir: `../comline` })
	await Yalc.publishPackage({ workingDir: `../treetrunks` })
}, 60_000)

let phase = 0
let tmpDir: tmp.DirResult
let git: SimpleGit

beforeEach(() => {
	phase = 0
	tmpDir = tmp.dirSync({ unsafeCleanup: true })
	git = simpleGit(tmpDir.name)
	process.chdir(tmpDir.name)
	console.log(`created tmpDir ${tmpDir.name}`)
})

afterEach(() => {
	tmpDir.removeCallback()
	console.log(`removed tmpDir ${tmpDir.name}`)
})

async function runScript(...args: string[]): Promise<ChildProcess> {
	const proc = spawn(`bun`, args, {
		stdio: `inherit`,
		env: { ...process.env, FORCE_COLOR: `1`, CI: `false` },
	})
	await new Promise((resolve) => proc.on(`exit`, resolve))
	return proc
}

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
		await Yalc.addPackages([`recoverage`, `comline`, `treetrunks`], {
			workingDir: `.`,
		})
		await rename(`.yalc`, `packages`)
		const install = await runScript(`install`)
		expect(install.exitCode).toBe(0)
	}
	phase++
}

describe(`recoverage`, () => {
	it(`approves a coverage improvement [sample-package-01]`, async () => {
		await loadSample(`sample-package-01`)

		await git.init().add(`.`).commit(`initial commit`)

		const test = await runScript(`test:coverage`)
		expect(test.exitCode).toBe(0)

		const coverage = await runScript(`coverage:status`)
		expect(coverage.exitCode).toBe(0)

		await git.checkout([`-b`, `test`])

		await loadSample(`sample-package-01`)

		const test2 = await runScript(`test:coverage`)
		expect(test2.exitCode).toBe(0)

		const coverage2 = await runScript(`coverage:status`)
		expect(coverage2.exitCode).toBe(0)
	}, 20_000)

	it(`fails a coverage decrease [sample-package-02]`, async () => {
		await loadSample(`sample-package-02`)

		await git.init().add(`.`).commit(`initial commit`)

		const test = await runScript(`test:coverage`)
		expect(test.exitCode).toBe(0)

		const coverage = await runScript(`coverage:status`)
		expect(coverage.exitCode).toBe(0)

		await loadSample(`sample-package-02`)

		const test2 = await runScript(`test:coverage`)
		expect(test2.exitCode).toBe(0)

		const coverage2 = await runScript(`coverage:status`)
		expect(coverage2.exitCode).toBe(1)
	}, 20_000)
})
