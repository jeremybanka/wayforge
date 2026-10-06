import { rejects } from "node:assert/strict"
import * as filesystem from "node:fs/promises"
import {
	mkdir,
	mkdtemp,
	readdir,
	readFile,
	rm,
	writeFile,
} from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"

import { afterEach, beforeEach, expect, it, spyOn } from "bun:test"
import { simpleGit } from "simple-git"

import type { BreakCheckBaseline, BreakCheckOptions } from "../src/break-check"
import { breakCheck, breakCheckPrelude } from "../src/break-check"

let directory: string
let producer: string
let repository: string
let remote: string
let options: BreakCheckOptions
const snapshot = `.break-check/baseline.json`

beforeEach(async () => {
	directory = await mkdtemp(path.join(tmpdir(), `break-check-baseline-`))
	producer = path.join(directory, `producer`)
	repository = path.join(directory, `checkout`)
	remote = path.join(directory, `remote.git`)
	await mkdir(path.join(producer, `tests`), { recursive: true })
	await writeFile(path.join(producer, `.gitignore`), `.break-check/\n.turbo/\n`)
	await writeFile(path.join(producer, `tests/public.txt`), `released-1`)
	await writeFile(path.join(producer, `tests/removed.txt`), `removed`)
	const git = simpleGit(producer)
	await git
		.init()
		.addConfig(`user.name`, `Test`)
		.addConfig(`user.email`, `test@example.invalid`)
	await git
		.add(`.`)
		.commit(`Release`)
		.addAnnotatedTag(`example@1.0.0`, `Release`)
	await git.clone(producer, remote, [`--bare`])
	await git.addRemote(`origin`, remote)
	await git.clone(remote, repository, [`--no-tags`])
	const local = simpleGit(repository)
	await local
		.addConfig(`user.name`, `Test`)
		.addConfig(`user.email`, `test@example.invalid`)
	await writeFile(path.join(repository, `tests/public.txt`), `current`)
	await local.rm([`tests/removed.txt`]).add(`.`).commit(`Current tests`)
	options = {
		baseDirname: repository,
		tagPattern: `refs/tags/example@`,
		testPattern: `tests/*.txt`,
		testCommand: `test "$(cat tests/public.txt)" = released-1 && test "$(cat tests/removed.txt)" = removed`,
		certifyCommand: `exit 1`,
		baselineFile: snapshot,
	}
})

afterEach(async () => {
	await rm(directory, { recursive: true, force: true })
})

function prelude(out = snapshot) {
	return breakCheckPrelude({
		baseDirname: repository,
		tagPattern: options.tagPattern,
		out,
	})
}

async function publish(tag = `example@2.0.0`) {
	const git = simpleGit(producer)
	await writeFile(path.join(producer, `tests/public.txt`), `released-2`)
	await git.add(`.`).commit(`New release`)
	await git.raw([`tag`, `-f`, tag])
	await git.push([`--force`, `origin`, `refs/tags/${tag}`])
	return git.revparse([`HEAD`])
}

async function assertRestored() {
	expect(await readFile(path.join(repository, `tests/public.txt`), `utf8`)).toBe(
		`current`,
	)
	expect(
		await Bun.file(path.join(repository, `tests/removed.txt`)).exists(),
	).toBe(false)
	expect((await simpleGit(repository).status()).isClean()).toBe(true)
}

it(`writes identical snapshots and peels annotated tags without running commands`, async () => {
	const baseline = await prelude()
	expect(baseline).toEqual({
		version: 1,
		tagPattern: options.tagPattern ?? null,
		packageDirectory: ``,
		ref: `refs/tags/example@1.0.0`,
		commit: await simpleGit(producer).revparse([`HEAD`]),
	})
	const contents = await readFile(path.join(repository, snapshot), `utf8`)
	await prelude()
	expect(await readFile(path.join(repository, snapshot), `utf8`)).toBe(contents)
	expect(await readdir(path.join(repository, `.break-check`))).toEqual([
		`baseline.json`,
	])
	await assertRestored()
})

it(`fetches a new release commit that the checkout does not already have`, async () => {
	const commit = await publish()
	await rejects(simpleGit(repository).raw([`cat-file`, `-t`, commit]))
	expect((await prelude()).commit).toBe(commit)
	expect(
		(await simpleGit(repository).raw([`cat-file`, `-t`, commit])).trim(),
	).toBe(`commit`)
	expect(await simpleGit(repository).tags()).toMatchObject({ all: [] })
	await assertRestored()
})

it.each([`example@2.0.0`, `example@1.0.0`])(
	`updates the snapshot when %s is published or moved`,
	async (tag) => {
		const first = await prelude()
		const commit = await publish(tag)
		const next = await prelude()
		expect(next.commit).toBe(commit)
		expect(next.commit).not.toBe(first.commit)
		expect(next.ref).toBe(`refs/tags/${tag}`)
		await assertRestored()
	},
)

it(`checks the pinned release after a newer release and a moved tag, without origin access`, async () => {
	await prelude()
	await publish()
	await simpleGit(producer).raw([`tag`, `-f`, `example@1.0.0`])
	await simpleGit(producer).push([
		`--force`,
		`origin`,
		`refs/tags/example@1.0.0`,
	])
	await simpleGit(repository).removeRemote(`origin`)
	expect(await breakCheck(options)).toMatchObject({
		lastReleaseTag: `refs/tags/example@1.0.0`,
		breakingChangesFound: false,
	})
	await assertRestored()
})

it.each([false, true])(
	`restores tests after failure with certification=%s`,
	async (certified) => {
		await prelude()
		expect(
			await breakCheck({
				...options,
				testCommand: `exit 1`,
				certifyCommand: certified ? `exit 0` : `exit 1`,
			}),
		).toMatchObject({
			breakingChangesFound: true,
			breakingChangesCertified: certified,
		})
		await assertRestored()
	},
)

it(`removes a stale snapshot when discovery fails`, async () => {
	await prelude()
	await simpleGit(repository).remote([
		`set-url`,
		`origin`,
		path.join(directory, `missing.git`),
	])
	await rejects(prelude(), /Failed to prepare baseline/)
	expect(await Bun.file(path.join(repository, snapshot)).exists()).toBe(false)
	await rejects(breakCheck(options), /Missing, invalid, or unusable baseline/)
	await assertRestored()
})

it(`fails without a matching release and invalidates the old snapshot`, async () => {
	await prelude()
	await simpleGit(producer).push([`origin`, `:refs/tags/example@1.0.0`])
	await rejects(prelude(), /Failed to prepare baseline/)
	expect(await Bun.file(path.join(repository, snapshot)).exists()).toBe(false)
	await assertRestored()
})

it(`does not leave a stale snapshot after a fetch failure`, async () => {
	await prelude()
	await publish()
	const uploadPack = path.join(directory, `upload-pack`)
	const count = path.join(directory, `remote-count`)
	await writeFile(
		uploadPack,
		`#!/bin/sh\nif [ -f '${count}' ]; then exit 1; fi\ntouch '${count}'\nexec git-upload-pack "$@"\n`,
	)
	await filesystem.chmod(uploadPack, 0o755)
	await simpleGit({
		baseDir: repository,
		unsafe: { allowUnsafePack: true },
	}).addConfig(`remote.origin.uploadpack`, uploadPack)
	await rejects(prelude(), /Failed to prepare baseline/)
	expect(await Bun.file(path.join(repository, snapshot)).exists()).toBe(false)
	expect(
		await Bun.file(
			path.join(repository, `.git/break-check-fetch.lock`),
		).exists(),
	).toBe(false)
	await assertRestored()
})

it(`requires ignored output and preserves tracked files when output is misconfigured`, async () => {
	await rejects(prelude(`tests/public.txt`))
	await rejects(prelude(`untracked.json`))
	await assertRestored()
})

it(`invalidates the old snapshot and cleans partial writes on an atomic-write failure`, async () => {
	await prelude()
	const originalWrite = filesystem.writeFile
	const fault = spyOn(filesystem, `writeFile`).mockImplementation(
		async (filename, data, opts) => {
			if (typeof filename === `string` && filename.endsWith(`.tmp`)) {
				await originalWrite(filename, `{`)
				throw new Error(`Injected write failure`)
			}
			return originalWrite(filename, data, opts)
		},
	)
	try {
		await rejects(prelude())
	} finally {
		fault.mockRestore()
	}
	expect(await readdir(path.join(repository, `.break-check`))).toEqual([])
	await assertRestored()
})

it.each([
	`{`,
	`null`,
	`{}`,
	`missing`,
	`unknown-commit`,
	`tag-object`,
	`wrong-pattern`,
	`wrong-package`,
	`bad-ref`,
])(`rejects %s snapshots without touching tests`, async (kind) => {
	const baseline: BreakCheckBaseline = await prelude()
	let contents: string = kind
	if (kind === `unknown-commit`) baseline.commit = `a`.repeat(40)
	if (kind === `tag-object`) {
		const git = simpleGit(repository)
		await git.addAnnotatedTag(`local@1.0.0`, `Not a commit object`)
		baseline.commit = await git.revparse([`local@1.0.0`])
	}
	if (kind === `wrong-pattern`) baseline.tagPattern = `other@`
	if (kind === `wrong-package`) baseline.packageDirectory = `other/`
	if (kind === `bad-ref`) baseline.ref = `refs/tags/bad ref`
	if (
		[
			`unknown-commit`,
			`tag-object`,
			`wrong-pattern`,
			`wrong-package`,
			`bad-ref`,
		].includes(kind)
	)
		contents = JSON.stringify(baseline)
	if (kind === `missing`) await rm(path.join(repository, snapshot))
	else await writeFile(path.join(repository, snapshot), contents)
	await rejects(breakCheck(options), /Missing, invalid, or unusable baseline/)
	await assertRestored()
})

it(`supports explicit config paths, base directories, and the baseline-file CLI alias`, async () => {
	const entrypoint = path.resolve(
		import.meta.dirname,
		`../bin/break-check.bin.js`,
	)
	const config = path.join(directory, `check.json`)
	await writeFile(config, JSON.stringify(options))
	function cli(args: string[]) {
		const result = Bun.spawnSync([`node`, entrypoint, ...args], {
			cwd: directory,
		})
		expect(result.exitCode, result.stderr.toString()).toBe(0)
		return result.stdout.toString()
	}
	expect(cli([`prelude`, config, `--out=${snapshot}`])).toContain(
		`Pinned refs/tags/example@1.0.0`,
	)
	expect(cli([config, `--baseline-file=${snapshot}`])).toContain(
		`No breaking changes were found`,
	)
	await assertRestored()
})

it(`keeps package snapshots separate and supports parallel pinned checks`, async () => {
	for (const name of [`one`, `two`]) {
		for (const [root, content] of [
			[producer, `released-${name}`],
			[repository, `current-${name}`],
		]) {
			await mkdir(path.join(root, `packages/${name}/tests`), { recursive: true })
			await writeFile(
				path.join(root, `packages/${name}/tests/public.txt`),
				content,
			)
		}
	}
	await simpleGit(repository).add(`.`).commit(`Current package tests`)
	await simpleGit(producer)
		.add(`.`)
		.commit(`Released package tests`)
		.addTag(`example@2.0.0`)
	await simpleGit(producer).push([`origin`, `refs/tags/example@2.0.0`])
	await Promise.all(
		[`one`, `two`].map(async (name) => {
			const baseDirname = path.join(repository, `packages/${name}`)
			const baseline = await breakCheckPrelude({
				baseDirname,
				tagPattern: options.tagPattern,
				out: snapshot,
			})
			expect(baseline.packageDirectory).toBe(`packages/${name}/`)
			expect(
				await breakCheck({
					...options,
					baseDirname,
					testCommand: `test "$(cat tests/public.txt)" = released-${name}`,
				}),
			).toMatchObject({ breakingChangesFound: false })
			expect(
				await readFile(path.join(baseDirname, `tests/public.txt`), `utf8`),
			).toBe(`current-${name}`)
		}),
	)
	await assertRestored()
})

it(`discovers a minimal default config for prelude without requiring check commands`, async () => {
	const entrypoint = path.resolve(
		import.meta.dirname,
		`../bin/break-check.bin.js`,
	)
	await writeFile(
		path.join(repository, `break-check.config.json`),
		JSON.stringify({ tagPattern: options.tagPattern }),
	)
	await simpleGit(repository).add(`.`).commit(`Default config`)
	const result = Bun.spawnSync([`node`, entrypoint, `prelude`], {
		cwd: repository,
	})
	expect(result.exitCode, result.stderr.toString()).toBe(0)
	expect(
		JSON.parse(await readFile(path.join(repository, snapshot), `utf8`)),
	).toMatchObject({ ref: `refs/tags/example@1.0.0` })
	await assertRestored()
})

it(`runs a fresh prelude on Turbo cache hits and misses on new releases and moved tags`, async () => {
	const entrypoint = path.resolve(import.meta.dirname, `../src/break-check.x.ts`)
	const turbo = path.resolve(
		import.meta.dirname,
		`../../../node_modules/.bin/turbo`,
	)
	await writeFile(
		path.join(repository, `package.json`),
		JSON.stringify({
			name: `baseline-cache-fixture`,
			private: true,
			packageManager: `bun@${Bun.version}`,
			scripts: {
				"test:breaks:prelude": `bun '${entrypoint}' prelude && echo ran >> .break-check/prelude.log`,
				"test:breaks": `bun '${entrypoint}' --baseline-file=${snapshot} && echo ran >> .break-check/check.log`,
			},
		}),
	)
	const install = Bun.spawnSync(
		[process.execPath, `install`, `--lockfile-only`, `--ignore-scripts`],
		{ cwd: repository },
	)
	expect(install.exitCode, install.stderr.toString()).toBe(0)
	await writeFile(
		path.join(repository, `turbo.json`),
		JSON.stringify({
			agentGuidance: false,
			tasks: {
				"test:breaks:prelude": { cache: false },
				"test:breaks": {
					dependsOn: [`test:breaks:prelude`, `^build`],
					inputs: [`$TURBO_DEFAULT$`, { mode: `jit`, globs: [snapshot] }],
					cache: true,
				},
				build: {},
			},
		}),
	)
	await writeFile(
		path.join(repository, `break-check.config.json`),
		JSON.stringify({
			...options,
			baseDirname: `.`,
			testCommand: `cat tests/public.txt > .break-check/observed.txt; grep -q '^released-' tests/public.txt`,
		}),
	)
	await simpleGit(repository).add(`.`).commit(`Turbo fixture`)
	function runTurbo() {
		const result = Bun.spawnSync(
			[
				turbo,
				`run`,
				`test:breaks`,
				`--cache-dir=.turbo/cache`,
				`--cache=local:rw`,
				`--env-mode=loose`,
			],
			{
				cwd: repository,
				env: { ...process.env, TURBO_TELEMETRY_DISABLED: `1` },
				timeout: 20_000,
			},
		)
		return {
			status: result.exitCode,
			output: result.stdout.toString() + result.stderr.toString(),
		}
	}
	async function counts(preludes: number, checks: number) {
		for (const [name, count] of [
			[`prelude`, preludes],
			[`check`, checks],
		] as const) {
			expect(
				(
					await readFile(
						path.join(repository, `.break-check/${name}.log`),
						`utf8`,
					)
				)
					.trim()
					.split(`\n`),
			).toHaveLength(count)
		}
		await assertRestored()
	}
	const first = runTurbo()
	expect(first.status, first.output).toBe(0)
	await counts(1, 1)
	const second = runTurbo()
	expect(second.status, second.output).toBe(0)
	expect(second.output).toContain(`cache hit`)
	await counts(2, 1)
	await publish()
	const newer = runTurbo()
	expect(newer.status, newer.output).toBe(0)
	await counts(3, 2)
	expect(
		await readFile(path.join(repository, `.break-check/observed.txt`), `utf8`),
	).toBe(`released-2`)
	await writeFile(path.join(producer, `tests/public.txt`), `released-3`)
	await simpleGit(producer)
		.add(`.`)
		.commit(`Moved release`)
		.raw([`tag`, `-f`, `example@2.0.0`])
	await simpleGit(producer).push([
		`--force`,
		`origin`,
		`refs/tags/example@2.0.0`,
	])
	const moved = runTurbo()
	expect(moved.status, moved.output).toBe(0)
	await counts(4, 3)
	expect(
		await readFile(path.join(repository, `.break-check/observed.txt`), `utf8`),
	).toBe(`released-3`)
	const repeated = runTurbo()
	expect(repeated.status, repeated.output).toBe(0)
	await counts(5, 3)
	await simpleGit(repository).remote([
		`set-url`,
		`origin`,
		path.join(directory, `missing.git`),
	])
	const failed = runTurbo()
	expect(failed.status, failed.output).not.toBe(0)
	await counts(5, 3)
	expect(await Bun.file(path.join(repository, snapshot)).exists()).toBe(false)
}, 30_000)
