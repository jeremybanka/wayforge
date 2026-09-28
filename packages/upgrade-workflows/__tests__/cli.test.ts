import { execFileSync, spawnSync } from "node:child_process"
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

import { afterEach, beforeEach, expect, it } from "vitest"

const cli = fileURLToPath(new URL(`../src/cli.ts`, import.meta.url))
let root: string

beforeEach(async () => {
	root = await mkdtemp(path.join(os.tmpdir(), `upgrade-workflows-cli-`))
})
afterEach(async () => {
	await rm(root, { recursive: true, force: true })
})

it(`resolves real annotated Git tags, previews, applies, and exits cleanly`, async () => {
	const remote = path.join(root, `remote`)
	await mkdir(remote)
	function git(...args: string[]): string {
		return execFileSync(
			`git`,
			[
				`-c`,
				`user.name=Fixture`,
				`-c`,
				`user.email=fixture@example.test`,
				`-c`,
				`commit.gpgsign=false`,
				`-c`,
				`tag.gpgsign=false`,
				...args,
			],
			{ cwd: remote, encoding: `utf8`, stdio: [`ignore`, `pipe`, `pipe`] },
		).trim()
	}
	git(`init`, `--quiet`)
	git(`commit`, `--allow-empty`, `-m`, `first`)
	git(`tag`, `v1.0.0`)
	git(`commit`, `--allow-empty`, `-m`, `second`)
	git(`tag`, `-a`, `v2.3.4`, `-m`, `release`)
	const commit = git(`rev-parse`, `HEAD`)
	const env = {
		...process.env,
		GIT_CONFIG_COUNT: `1`,
		GIT_CONFIG_KEY_0: `url.${pathToFileURL(remote).href}.insteadOf`,
		GIT_CONFIG_VALUE_0: `https://github.com/acme/action.git`,
	}
	const repo = path.join(root, `consumer`)
	await mkdir(path.join(repo, `.github/workflows`), { recursive: true })
	const file = path.join(repo, `.github/workflows/check.yml`)
	const source = `jobs:\n  test:\n    steps:\n      - uses: acme/action@v1\n`
	await writeFile(file, source)
	const preview = spawnSync(
		process.execPath,
		[cli, `--cwd`, repo, `--dry-run`],
		{ env, encoding: `utf8` },
	)
	expect(preview.status, preview.stderr).toBe(0)
	expect(preview.stdout).toContain(`Dry run: 1 file(s) would change`)
	expect(await readFile(file, `utf8`)).toBe(source)
	const apply = spawnSync(process.execPath, [cli], {
		cwd: repo,
		env,
		encoding: `utf8`,
	})
	expect(apply.status, apply.stderr).toBe(0)
	expect(apply.stdout).toContain(`Updated 1 file(s)`)
	expect(await readFile(file, `utf8`)).toContain(
		`acme/action@${commit} # v2.3.4`,
	)
})

it(`prints help and rejects unknown flags without touching the repository`, () => {
	const help = spawnSync(process.execPath, [cli, `--help`], {
		cwd: root,
		encoding: `utf8`,
	})
	expect(help.status).toBe(0)
	expect(help.stdout).toContain(`upgrade-workflows [--dry-run]`)
	const invalid = spawnSync(process.execPath, [cli, `--dryrun`], {
		cwd: root,
		encoding: `utf8`,
	})
	expect(invalid.status).toBe(1)
	expect(invalid.stderr).toContain(`Unknown option`)
})
