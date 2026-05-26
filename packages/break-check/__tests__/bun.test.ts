import { mkdtempSync, rmSync } from "node:fs"
import { mkdir } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"

import { afterEach, beforeEach, describe, expect, it } from "bun:test"
import simpleGit from "simple-git"

import type { BreakCheckOutcome } from "../src/break-check"
import { breakCheck } from "../src/break-check"
import { bunCopyFile } from "./utilities"

let tempDir: string
let localRepoDirname: string
let remoteRepoDirname: string
const testDirname = import.meta.dir

beforeEach(async () => {
	tempDir = mkdtempSync(path.join(tmpdir(), `break-check-`))
	localRepoDirname = `${tempDir}/my-library`
	remoteRepoDirname = `${tempDir}/my-library.git`
	await mkdir(remoteRepoDirname)

	const remoteGit = simpleGit(remoteRepoDirname)
	await remoteGit
		.init([`--bare`, `--initial-branch=main`])
		.cwd(remoteRepoDirname)

	await bunCopyFile(
		`${testDirname}/fixtures/bun/src.js`,
		`${localRepoDirname}/src.js`,
	)
	await bunCopyFile(
		`${testDirname}/fixtures/bun/public-method__public.test.js`,
		`${localRepoDirname}/public-method__public.test.js`,
	)
	await bunCopyFile(
		`${testDirname}/fixtures/bun/private-method.test.js`,
		`${localRepoDirname}/private-method.test.js`,
	)
	await bunCopyFile(
		`${testDirname}/fixtures/bun/certify-major-version.ts`,
		`${localRepoDirname}/certify-major-version.ts`,
	)
	await bunCopyFile(
		`${testDirname}/fixtures/bun/.changesets/decent-files-exemplify.md`,
		`${localRepoDirname}/.changesets/decent-files-exemplify.md`,
	)
	expect(
		await Bun.file(`${localRepoDirname}/public-method__public.test.js`).text(),
	).toEqual(
		await Bun.file(
			`${testDirname}/fixtures/bun/public-method__public.test.js`,
		).text(),
	)
})
afterEach(() => {
	rmSync(tempDir, { recursive: true, force: true })
})

describe(`break-check`, () => {
	it(`determines whether breaking changes were made`, async () => {
		const git = simpleGit(localRepoDirname)
		await git
			.init()
			.add(`.`)
			.commit(`Initial commit`)
			.addAnnotatedTag(`my-library@1.0.0`, `initial release`)
		await git.addRemote(`origin`, remoteRepoDirname)
		await git.push([`--tags`, `origin`])

		const srcContent = await Bun.file(`${localRepoDirname}/src.js`).text()
		const modifiedSrcContent = srcContent.replace(
			`"publicMethodOutput"`,
			`"modifiedPublicMethodOutput"`,
		)
		await Bun.write(`${localRepoDirname}/src.js`, modifiedSrcContent)
		const testContent = await Bun.file(
			`${localRepoDirname}/public-method__public.test.js`,
		).text()
		const modifiedTestContent = testContent.replace(
			`"publicMethodOutput"`,
			`"modifiedPublicMethodOutput"`,
		)
		await Bun.write(
			`${localRepoDirname}/public-method__public.test.js`,
			modifiedTestContent,
		)
		await git.add(`.`)
		await git.commit(`breaking change`)
		let caught: unknown
		let returnValue: (BreakCheckOutcome & { summary: string }) | undefined
		try {
			returnValue = await breakCheck({
				tagPattern: `my-library`,
				testPattern: `*__public.test.js`,
				testCommand: `bun test *__public.test.js`,
				certifyCommand: `bun ./certify-major-version.ts`,
				baseDirname: localRepoDirname,
				verbose: true,
			})
		} catch (thrown) {
			caught = thrown
			console.log(thrown)
		}
		expect(caught).toBeUndefined()
		expect(returnValue?.summary).toBe(
			`Breaking changes were found and certified.`,
		)
	})
})
