import { rejects } from "node:assert/strict"
import * as filesystem from "node:fs/promises"
import {
	chmod,
	mkdir,
	mkdtemp,
	readdir,
	readFile,
	rm,
	symlink,
	writeFile,
} from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { setTimeout } from "node:timers/promises"

import { afterEach, beforeEach, expect, it, spyOn } from "bun:test"
import simpleGit from "simple-git"

import { breakCheck } from "../src/break-check"
import { withTestFileState } from "../src/test-file-state"

let temporaryDirectory: string
let repository: string

beforeEach(async () => {
	temporaryDirectory = await mkdtemp(
		path.join(tmpdir(), `break-check-lifecycle-`),
	)
	repository = path.join(temporaryDirectory, `repository`)
	await mkdir(path.join(repository, `old`), { recursive: true })
	await writeFile(path.join(repository, `old/public.test.js`), `released`)
	await writeFile(path.join(repository, `README.md`), `fixture`)
	await simpleGit(repository)
		.init()
		.addConfig(`user.name`, `Break Check Test`)
		.addConfig(`user.email`, `break-check@example.invalid`)
		.add(`.`)
		.commit(`Release`)
		.addTag(`example@1.0.0`)
})

afterEach(async () => {
	await rm(temporaryDirectory, { recursive: true, force: true })
})

for (const removed of [false, true]) {
	it(`refuses cleanup through a changed parent for ${removed ? `release-only` : `existing`} tests`, async () => {
		const git = simpleGit(repository)
		if (removed) await git.rm([`old/public.test.js`])
		else await writeFile(path.join(repository, `old/public.test.js`), `current`)
		await git.add(`.`).commit(`Current tests`)
		const restore = await withTestFileState(git, repository, (state) =>
			state.replaceTests(`example@1.0.0`, [`old/public.test.js`]),
		)
		const outside = path.join(temporaryDirectory, `outside`)
		await mkdir(outside)
		await writeFile(path.join(outside, `public.test.js`), `unrelated`)
		await rm(path.join(repository, `old`), { recursive: true })
		await symlink(outside, path.join(repository, `old`), `dir`)
		const failure = await restore().catch((thrown: unknown) => thrown)
		expect(await readFile(path.join(outside, `public.test.js`), `utf8`)).toBe(
			`unrelated`,
		)
		expect(String(failure)).toContain(`Cannot replace tests through`)
		const stateDirectory = path.join(repository, `.git/break-check`)
		const entries = await readdir(stateDirectory)
		expect(entries).toHaveLength(1)
		expect(
			JSON.parse(await readFile(path.join(stateDirectory, entries[0]), `utf8`)),
		).toMatchObject({ recoveryRequired: true, paths: [`old/public.test.js`] })
	})
}

it(`rejects a base directory outside the selected worktree before entering the file lifecycle`, async () => {
	const outside = path.join(temporaryDirectory, `outside`)
	await mkdir(outside)
	await rejects(
		withTestFileState(simpleGit(repository), outside, () =>
			Promise.resolve(`entered`),
		),
		/outside the worktree/,
	)
})

it.each([1, 2])(
	`restores active tests while another check waits for remote operation %i`,
	async (invocation) => {
		const git = simpleGit(repository)
		await writeFile(path.join(repository, `old/public.test.js`), `current`)
		await git.add(`.`).commit(`Current tests`)
		const remote = path.join(temporaryDirectory, `remote.git`)
		await git.clone(repository, remote, [`--bare`])
		await git.addRemote(`origin`, remote)
		const restore = await withTestFileState(git, repository, (state) =>
			state.replaceTests(`example@1.0.0`, [`old/public.test.js`]),
		)
		const started = path.join(temporaryDirectory, `remote-started`)
		const gate = path.join(temporaryDirectory, `release-remote`)
		const uploadPack = path.join(temporaryDirectory, `upload-pack`)
		await writeFile(
			uploadPack,
			`#!/bin/sh\ncount=0\n[ ! -f '${started}.count' ] || count=$(cat '${started}.count')\ncount=$((count + 1))\necho "$count" > '${started}.count'\nif [ "$count" -eq ${invocation} ]; then\ntouch '${started}'\nwhile [ ! -f '${gate}' ]; do sleep 0.02; done\nfi\nexec git-upload-pack "$@"\n`,
		)
		await chmod(uploadPack, 0o755)
		await simpleGit({
			baseDir: repository,
			unsafe: { allowUnsafePack: true },
		}).addConfig(`remote.origin.uploadpack`, uploadPack)
		const other = breakCheck({
			baseDirname: repository,
			tagPattern: `example@`,
			testPattern: `missing/*`,
			testCommand: `exit 0`,
			certifyCommand: `exit 1`,
		})
		let restoration: Promise<void> | undefined
		try {
			const deadline = Date.now() + 3000
			while (!(await Bun.file(started).exists())) {
				if (Date.now() > deadline) throw new Error(`Remote did not start`)
				await setTimeout(10)
			}
			restoration = restore()
			const completedBeforeRemote = await Promise.race([
				restoration.then(() => true),
				setTimeout(500).then(() => false),
			])
			expect(completedBeforeRemote).toBe(true)
			expect(
				await readFile(path.join(repository, `old/public.test.js`), `utf8`),
			).toBe(`current`)
			// Dirtiness introduced during the remote operation must be checked again.
			await writeFile(path.join(repository, `README.md`), `uncommitted`)
		} finally {
			await writeFile(gate, `go`)
			await restoration
			const result = await other
			expect(result.gitWasClean).toBe(false)
		}
	},
	10000,
)

it(`does not abandon restoration when a local critical section outlasts the setup timeout`, async () => {
	const git = simpleGit(repository)
	await writeFile(path.join(repository, `old/public.test.js`), `current`)
	await git.add(`.`).commit(`Current tests`)
	const restore = await withTestFileState(git, repository, (state) =>
		state.replaceTests(`example@1.0.0`, [`old/public.test.js`]),
	)
	const entered = Promise.withResolvers<void>()
	const gate = Promise.withResolvers<void>()
	const holder = withTestFileState(git, repository, async () => {
		entered.resolve()
		await gate.promise
	})
	await entered.promise
	let now = Date.now()
	const clock = spyOn(Date, `now`).mockImplementation(() => {
		now += 61_000
		return now
	})
	let failure: unknown
	const restoration = restore().catch((thrown: unknown) => {
		failure = thrown
	})
	try {
		await setTimeout(250)
	} finally {
		clock.mockRestore()
		gate.resolve()
		await holder
		await restoration
	}
	expect(failure).toBeUndefined()
	expect(
		await readFile(path.join(repository, `old/public.test.js`), `utf8`),
	).toBe(`current`)
})

it(`preserves the last valid recovery record when its replacement is only partially written`, async () => {
	const git = simpleGit(repository)
	await writeFile(path.join(repository, `old/public.test.js`), `current`)
	await git.add(`.`).commit(`Current tests`)
	const restore = await withTestFileState(git, repository, (state) =>
		state.replaceTests(`example@1.0.0`, [`old/public.test.js`]),
	)
	const directory = path.join(repository, `.git/break-check`)
	const [recordName] = await readdir(directory)
	const recordPath = path.join(directory, recordName)
	const originalRecord = await readFile(recordPath, `utf8`)
	const originalWrite = filesystem.writeFile
	const writeFault = spyOn(filesystem, `writeFile`).mockImplementation(
		async (filename, data, options) => {
			if (typeof filename === `string` && filename.startsWith(directory)) {
				await originalWrite(filename, `{`)
				throw Object.assign(new Error(`Injected ENOSPC`), { code: `ENOSPC` })
			}
			return originalWrite(filename, data, options)
		},
	)
	try {
		await rejects(restore(), /Injected ENOSPC/)
	} finally {
		writeFault.mockRestore()
	}
	expect(await readFile(recordPath, `utf8`)).toBe(originalRecord)
	expect(JSON.parse(await readFile(recordPath, `utf8`))).toMatchObject({
		paths: [`old/public.test.js`],
		head: await git.revparse([`HEAD`]),
	})
	expect(await readdir(directory)).toEqual([recordName])
	await restore()
	expect(
		await readFile(path.join(repository, `old/public.test.js`), `utf8`),
	).toBe(`current`)
})

for (const contents of [
	`{`,
	`null`,
	`{}`,
	JSON.stringify({ pid: process.pid, paths: [`.`], head: `a`.repeat(40) }),
]) {
	it(`identifies a corrupt recovery record: ${contents}`, async () => {
		const directory = path.join(repository, `.git/break-check`)
		await mkdir(directory)
		const recordPath = path.join(directory, `broken.json`)
		await writeFile(recordPath, contents)
		await writeFile(path.join(repository, `README.md`), `uncommitted`)
		const failure = await withTestFileState(
			simpleGit(repository),
			repository,
			(state) => state.isClean(),
		).catch((thrown: unknown) => thrown)
		expect(failure).toBeInstanceOf(Error)
		expect(String(failure)).toContain(`unreadable or invalid`)
		expect(String(failure)).toContain(recordPath)
		expect(String(failure)).toContain(`recover its test files before removing`)
		expect(await readFile(recordPath, `utf8`)).toBe(contents)
		expect(await readFile(path.join(repository, `README.md`), `utf8`)).toBe(
			`uncommitted`,
		)
		expect(await readdir(directory)).toEqual([`broken.json`])
	})
}
