import { execSync, spawn } from "node:child_process"
import { readFile, writeFile } from "node:fs/promises"

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

async function editJsonFile(filePath: string, edit: (json: any) => void) {
	const fileText = await readFile(filePath, `utf-8`)
	const json = JSON.parse(fileText)
	edit(json)
	const newFileText = JSON.stringify(json, null, `\t`)
	await writeFile(filePath, newFileText)
}

describe(`cli`, () => {
	it(`builds and runs`, async () => {
		const build = spawn(`bun`, [`build.bun.ts`], { stdio: `inherit` })
		const buildCode = await new Promise((resolve) => build.on(`exit`, resolve))
		expect(buildCode).toBe(0)
		await Yalc.publishPackage({ workingDir: `.` })
		await Yalc.publishPackage({ workingDir: `../comline` })
		await Yalc.publishPackage({ workingDir: `../treetrunks` })
		process.chdir(tmpDir.name)
		const projectInit = spawn(`bun`, [`init`], { stdio: `inherit` })
		await new Promise((resolve) => projectInit.on(`exit`, resolve))
		expect(projectInit.exitCode).toBe(0)
		await editJsonFile(`package.json`, (json) => {
			Object.assign(json, {
				workspaces: [`.yalc/*`],
			})
		})
		await Yalc.addPackages([`varmint`, `comline`, `treetrunks`], {
			workingDir: `.`,
		})
		console.log(execSync(`cat package.json`).toString())
		console.log(execSync(`ls -la node_modules`).toString())
		const install = spawn(`bun`, [`install`], { stdio: `inherit` })
		await new Promise((resolve) => install.on(`exit`, resolve))
		expect(install.exitCode).toBe(0)

		const help = spawn(
			`bun`,
			[`./.yalc/varmint/dist/varmint.bin.js`, `--help`],
			{
				stdio: `inherit`,
			},
		)
		const helpCode = await new Promise((resolve) => help.on(`exit`, resolve))
		if (helpCode !== 0) {
			console.log(help.stderr)
		}
		expect(helpCode).toBe(0)

		const track = spawn(
			`bun`,
			[`./.yalc/varmint/dist/varmint.bin.js`, `track`],
			{ stdio: `inherit` },
		)
		const trackCode = await new Promise((resolve) => track.on(`exit`, resolve))
		expect(trackCode).toBe(0)

		const clean = spawn(
			`bun`,
			[`./.yalc/varmint/dist/varmint.bin.js`, `clean`, `--ci-flag=CI`],
			{ stdio: `inherit`, env: { ...process.env, CI: `true` } },
		)
		const cleanCode = await new Promise((resolve) => clean.on(`exit`, resolve))
		expect(cleanCode).toBe(0)
	}, 10_000)
})
