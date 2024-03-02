import { afterEach, beforeEach, describe, expect, it } from "bun:test"

import git from "simple-git"
import tmp from "tmp"

import { breakCheck } from "../src/break-check"
import { bunCopyFile } from "./utilities"

let tempDir: tmp.DirResult

beforeEach(async () => {
	tempDir = tmp.dirSync({ unsafeCleanup: true })
	await bunCopyFile(`./__tests__/fixtures/node/src.js`, `${tempDir.name}/src.js`)
	await bunCopyFile(
		`./__tests__/fixtures/node/public-method__public.test.js`,
		`${tempDir.name}/public-method__public.test.js`,
	)
	bunCopyFile(
		`./__tests__/fixtures/node/private-method.test.js`,
		`${tempDir.name}/private-method.test.js`,
	)
	expect(
		await Bun.file(`${tempDir.name}/public-method__public.test.js`).text(),
	).toEqual(
		await Bun.file(
			`__tests__/fixtures/node/public-method__public.test.js`,
		).text(),
	)
})
afterEach(() => tempDir.removeCallback())

describe(`break-check`, () => {
	it(`determines whether breaking changes were made`, async () => {
		const testGitInstance = git(tempDir.name)
		await testGitInstance
			.init()
			.add(`.`)
			.commit(`initial commit`)
			.addAnnotatedTag(`my-library@1.0.0`, `initial release`)
		await breakCheck({
			tagPattern: `my-library`,
			testPattern: `*__public.test.js`,
			testCommand: `bun test *__public.test.js`,
			baseDirname: tempDir.name,
		})
	})
})
