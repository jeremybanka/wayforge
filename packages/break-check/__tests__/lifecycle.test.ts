import { rejects } from "node:assert/strict"
import {
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

import { afterEach, beforeEach, expect, it } from "bun:test"
import simpleGit from "simple-git"

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
