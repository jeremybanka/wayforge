import { spawn } from "node:child_process"
import * as fs from "node:fs"
import path from "node:path"

import * as tmp from "tmp"

let tempDir: tmp.DirResult
const utils = { put: (..._: unknown[]) => undefined }

beforeEach(() => {
	vitest.spyOn(utils, `put`).mockReset()
	tempDir = tmp.dirSync({ unsafeCleanup: true })
})
afterEach(() => {
	tempDir.removeCallback()
})

describe(`flushing with workspace manager`, () => {
	test(`flushing untouched files`, async () => {
		const setup = spawn(
			`node`,
			[`--experimental-strip-types`, `global-setup.node.ts`, tempDir.name],
			{
				stdio: `inherit`,
				cwd: path.join(import.meta.dirname, `isolation-flush`),
			},
		)
		await new Promise((resolve) => setup.on(`exit`, resolve))
		fs.mkdirSync(path.join(tempDir.name, `other`))
		console.log(`tempDir contents:`, fs.readdirSync(tempDir.name))
		fs.writeFileSync(
			path.join(tempDir.name, `rand`, `some-random-file.whatever`),
			`{}`,
		)
		fs.writeFileSync(
			path.join(tempDir.name, `myStreamer`, `another-random-file.whatever`),
			`{}`,
		)
		expect(fs.readdirSync(tempDir.name)).toEqual([`myStreamer`, `other`, `rand`])
		expect(fs.readdirSync(path.join(tempDir.name, `rand`))).toEqual([
			`my-rand.input.json`,
			`my-rand.output.json`,
			`some-random-file.whatever`,
		])
		expect(fs.readdirSync(path.join(tempDir.name, `myStreamer`))).toEqual([
			`another-random-file.whatever`,
			`myAsyncIterable.input.json`,
			`myAsyncIterable.stream.txt`,
		])
		const teardown = spawn(
			`node`,
			[`--experimental-strip-types`, `global-teardown.node.ts`],
			{
				stdio: `inherit`,
				cwd: path.join(import.meta.dirname, `isolation-flush`),
			},
		)
		await new Promise((resolve) => teardown.on(`exit`, resolve))
		expect(fs.readdirSync(tempDir.name)).toEqual([`myStreamer`, `rand`])
		expect(fs.readdirSync(path.join(tempDir.name, `rand`))).toEqual([
			`my-rand.input.json`,
			`my-rand.output.json`,
		])
		expect(fs.readdirSync(path.join(tempDir.name, `myStreamer`))).toEqual([
			`myAsyncIterable.input.json`,
			`myAsyncIterable.stream.txt`,
		])
	})
})
