import { afterEach, beforeEach, describe, expect, it } from "bun:test"

import { breakCheck } from "break-check"

import simpleGit from "simple-git"
import tmp from "tmp"

import { bunCopyFile } from "./utilities"

let tempDir: tmp.DirResult
const testDirname = import.meta.dir

beforeEach(async () => {
	tempDir = tmp.dirSync({ unsafeCleanup: true })
	await bunCopyFile(
		`${testDirname}/fixtures/bun/src.js`,
		`${tempDir.name}/src.js`,
	)
	await bunCopyFile(
		`${testDirname}/fixtures/bun/public-method__public.test.js`,
		`${tempDir.name}/public-method__public.test.js`,
	)
	bunCopyFile(
		`${testDirname}/fixtures/bun/private-method.test.js`,
		`${tempDir.name}/private-method.test.js`,
	)
	expect(
		await Bun.file(`${tempDir.name}/public-method__public.test.js`).text(),
	).toEqual(
		await Bun.file(
			`${testDirname}/fixtures/bun/public-method__public.test.js`,
		).text(),
	)
})
afterEach(() => tempDir.removeCallback())

describe(`break-check`, () => {
	it(`determines whether breaking changes were made`, async () => {
		const git = simpleGit(tempDir.name)
		await git
			.init()
			.add(`.`)
			.commit(`initial commit`)
			.addAnnotatedTag(`my-library@1.0.0`, `initial release`)
		const srcContent = await Bun.file(`${tempDir.name}/src.js`).text()
		const modifiedSrcContent = srcContent.replace(
			`"publicMethodOutput"`,
			`"modifiedPublicMethodOutput"`,
		)
		await Bun.write(`${tempDir.name}/src.js`, modifiedSrcContent)
		const testContent = await Bun.file(
			`${tempDir.name}/public-method__public.test.js`,
		).text()
		const modifiedTestContent = testContent.replace(
			`"publicMethodOutput"`,
			`"modifiedPublicMethodOutput"`,
		)
		await Bun.write(
			`${tempDir.name}/public-method__public.test.js`,
			modifiedTestContent,
		)
		await git.add(`.`)
		await git.commit(`breaking change`)
		let caught: unknown
		try {
			await breakCheck({
				tagPattern: `my-library`,
				testPattern: `*__public.test.js`,
				testCommand: `bun test *__public.test.js`,
				baseDirname: tempDir.name,
			})
		} catch (thrown) {
			caught = thrown
			console.log(thrown)
		}
		expect(caught).toBeInstanceOf(Error)
	})
})
