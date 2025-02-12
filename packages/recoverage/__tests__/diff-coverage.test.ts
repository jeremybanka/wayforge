import { spawn } from "node:child_process"
import { copyFile, readdir } from "node:fs/promises"
import * as path from "node:path"

import simpleGit from "simple-git"
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
		const build = spawn(`pnpm`, [`tsup-node`], {
			stdio: `inherit`,
			env: { ...process.env, FORCE_COLOR: `1` },
		})
		const buildCode = await new Promise((resolve) => build.on(`exit`, resolve))
		expect(buildCode).toBe(0)
		await Promise.all([
			Yalc.publishPackage({ workingDir: `.`, workspaceResolve: true }),
			readdir(path.resolve(__dirname, `sample-package-01`)).then((files) =>
				Promise.all(
					files.map(async (file) => {
						if (!file.includes(`2`)) {
							await copyFile(
								path.resolve(__dirname, `sample-package-01/${file}`),
								path.resolve(tmpDir.name, file),
							)
							console.log(`copied ${file}`)
						}
					}),
				),
			),
		])
		process.chdir(tmpDir.name)
		await Yalc.addPackages([`recoverage`], { workingDir: `.` })

		const install = spawn(`bun`, [`install`], {
			stdio: `inherit`,

			env: { ...process.env, FORCE_COLOR: `1` },
		})
		await new Promise((resolve) => install.on(`exit`, resolve))
		expect(install.exitCode).toBe(0)

		const test = spawn(`bun`, [`test:coverage`], {
			stdio: `inherit`,
			env: { ...process.env, FORCE_COLOR: `1` },
		})
		await new Promise((resolve) => test.on(`exit`, resolve))
		expect(test.exitCode).toBe(0)

		const git = simpleGit(tmpDir.name)
		await git.init().add(`.`).commit(`initial commit`)
		console.log(await git.branch())

		const coverage = spawn(`bun`, [`coverage:status`], {
			stdio: `inherit`,
			env: { ...process.env, FORCE_COLOR: `1` },
		})
		await new Promise((resolve) => coverage.on(`exit`, resolve))
		expect(coverage.exitCode).toBe(0)

		await git.checkout([`-b`, `test`])

		console.log(await git.branch())

		await copyFile(
			path.resolve(__dirname, `sample-package-01/sample2.test.ts`),
			path.resolve(tmpDir.name, `sample2.test.ts`),
		)

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
	}, 10_000)
})
