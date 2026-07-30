import { spawn } from "node:child_process"
import * as fs from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"

import { Ferret, Squirrel } from "../src"

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

describe(`instance flush`, () => {
	test(`Squirrel preserves every touched case in a collection`, async () => {
		const squirrel = new Squirrel(`write`, tempDir)
		const values = squirrel.add(`values`, (value: string) =>
			Promise.resolve(value),
		)

		for (const value of [`first`, `second`, `third`]) {
			await values.for(value).get(value)
		}

		fs.writeFileSync(path.join(tempDir, `values/stale.input.json`), `[]`)
		fs.writeFileSync(path.join(tempDir, `values/stale.output.json`), `null`)

		values.flush()

		expect(fs.readdirSync(path.join(tempDir, `values`))).toEqual([
			`first.input.json`,
			`first.output.json`,
			`second.input.json`,
			`second.output.json`,
			`third.input.json`,
			`third.output.json`,
		])
	})

	test(`Ferret preserves every touched case in a collection`, async () => {
		const ferret = new Ferret(`write`, tempDir)
		const values = ferret.add(`values`, async function* (value: string) {
			await Promise.resolve()
			yield value
		})

		for (const value of [`first`, `second`, `third`]) {
			for await (const _ of await values.for(value).get(value)) {
				// Consume the stream so Ferret writes the complete fixture.
			}
		}

		fs.writeFileSync(path.join(tempDir, `values/stale.input.json`), `[]`)
		fs.writeFileSync(path.join(tempDir, `values/stale.stream.txt`), ``)

		values.flush()

		expect(fs.readdirSync(path.join(tempDir, `values`))).toEqual([
			`first.input.json`,
			`first.stream.txt`,
			`second.input.json`,
			`second.stream.txt`,
			`third.input.json`,
			`third.stream.txt`,
		])
	})
})
