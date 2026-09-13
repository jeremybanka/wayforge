import { execFileSync } from "node:child_process"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"

export let directory: string
let environment: NodeJS.ProcessEnv

export function run(
	command: string,
	args: string[],
	cwd: string = directory,
): string {
	return execFileSync(command, args, {
		cwd,
		env: environment,
		encoding: `utf8`,
		timeout: 60_000,
		stdio: [`ignore`, `pipe`, `pipe`],
	})
}

beforeAll(() => {
	directory = mkdtempSync(path.join(tmpdir(), `comline-cobra-`))
	environment = {
		...process.env,
		XDG_CONFIG_HOME: path.join(directory, `config`),
		XDG_CACHE_HOME: path.join(directory, `cache`),
	}
	for (const tool of [`go`, `bun`, `node`]) {
		run(tool, tool === `go` ? [`version`] : [`--version`])
	}
	run(
		`go`,
		[`build`, `-o`, path.join(directory, `cobra-oracle`), `.`],
		path.join(import.meta.dirname, `../fixtures/cobra`),
	)
	const fixture = path.join(import.meta.dirname, `../fixtures/completion.x.ts`)
	run(`bun`, [
		`build`,
		fixture,
		`--target=node`,
		`--outfile=${directory}/cli.js`,
	])
}, 120_000)

afterAll(() => {
	if (directory) rmSync(directory, { recursive: true, force: true })
})
