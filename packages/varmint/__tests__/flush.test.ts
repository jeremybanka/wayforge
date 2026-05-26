import { spawn } from "node:child_process"
import * as fs from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"

let tempDir: string
const utils = { put: (..._: unknown[]) => undefined }

beforeEach(() => {
	vitest.spyOn(utils, `put`).mockReset()
	tempDir = fs.mkdtempSync(path.join(tmpdir(), `varmint-`))
})
afterEach(() => {
	fs.rmSync(tempDir, { recursive: true, force: true })
})

describe(`flushing with workspace manager`, () => {
	test(`flushing untouched files`, async () => {
		const setup = spawn(`node`, [`global-setup.node.ts`, tempDir], {
			stdio: `inherit`,
			cwd: path.join(import.meta.dirname, `isolation-flush`),
		})
		await new Promise((resolve) => setup.on(`exit`, resolve))
		fs.mkdirSync(path.join(tempDir, `other`))
		console.log(`tempDir contents:`, fs.readdirSync(tempDir))
		fs.writeFileSync(
			path.join(tempDir, `rand`, `some-random-file.whatever`),
			`{}`,
		)
		fs.writeFileSync(
			path.join(tempDir, `myStreamer`, `another-random-file.whatever`),
			`{}`,
		)
		expect(fs.readdirSync(tempDir)).toEqual([`myStreamer`, `other`, `rand`])
		expect(fs.readdirSync(path.join(tempDir, `rand`))).toEqual([
			`my-rand.input.json`,
			`my-rand.output.json`,
			`some-random-file.whatever`,
		])
		expect(fs.readdirSync(path.join(tempDir, `myStreamer`))).toEqual([
			`another-random-file.whatever`,
			`myAsyncIterable.input.json`,
			`myAsyncIterable.stream.txt`,
		])
		const teardown = spawn(`node`, [`global-teardown.node.ts`], {
			stdio: `inherit`,
			cwd: path.join(import.meta.dirname, `isolation-flush`),
		})
		await new Promise((resolve) => teardown.on(`exit`, resolve))
		expect(fs.readdirSync(tempDir)).toEqual([`myStreamer`, `rand`])
		expect(fs.readdirSync(path.join(tempDir, `rand`))).toEqual([
			`my-rand.input.json`,
			`my-rand.output.json`,
		])
		expect(fs.readdirSync(path.join(tempDir, `myStreamer`))).toEqual([
			`myAsyncIterable.input.json`,
			`myAsyncIterable.stream.txt`,
		])
	})
})
