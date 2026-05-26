import type { ChildProcess } from "node:child_process"
import { spawn } from "node:child_process"
import * as fs from "node:fs"
import * as http from "node:http"
import { tmpdir } from "node:os"
import path from "node:path"

import { Squirrel } from "../src"

let server: http.Server
let tempDir: string
const utils = { put: (..._: unknown[]) => undefined }

beforeEach(() => {
	vitest.spyOn(utils, `put`).mockReset()

	server = http.createServer((req, res) => {
		let data: Uint8Array[] = []
		req
			.on(`data`, (chunk) => data.push(chunk))
			.on(`end`, () => {
				utils.put(req, res)
				res.writeHead(200, { "Content-Type": `text/plain` })
				res.end(`The best way to predict the future is to invent it.`)
				data = []
			})
	})
	server.listen(13555)
	tempDir = fs.mkdtempSync(path.join(tmpdir(), `varmint-`))
})
afterEach(() => {
	server.close()
	fs.rmSync(tempDir, { recursive: true, force: true })
})

describe(`cache miss`, () => {
	test(`error contents`, async () => {
		const squirrel = new Squirrel(`read`, tempDir)
		fs.mkdirSync(path.join(tempDir, `hello`))
		fs.writeFileSync(
			path.join(tempDir, `hello/casa.input.json`),
			`[\n\t"http://localhost:13555"\n]`,
		)
		const fetcher = squirrel.add(`hello`, async (url: string) => {
			return fetch(url).then((response) => response.text())
		})
		let caught: Error | undefined
		try {
			await fetcher.for(`home`).get(`http://localhost:13555`)
		} catch (thrown) {
			if (thrown instanceof Error) {
				console.error(`💥`, thrown)
				caught = thrown
			}
		} finally {
			expect(caught).toBeInstanceOf(Error)
			expect(utils.put).toHaveBeenCalledTimes(0)
		}
	})
	test(`flushing untouched files`, async () => {
		let setup: ChildProcess
		try {
			setup = spawn(`node`, [`global-setup.node.ts`, tempDir], {
				stdio: `inherit`,
				cwd: path.join(import.meta.dirname, `isolation-cache-miss`),
			})
		} catch (thrown) {
			console.error(`💥`, thrown)
		}
		await new Promise((resolve) => setup.on(`exit`, resolve))
		console.log(`tempDir contents:`, fs.readdirSync(tempDir))

		expect(fs.readdirSync(tempDir)).toEqual([`rand`])
		expect(fs.readdirSync(path.join(tempDir, `rand`))).toEqual([
			`my-rand.input.json`,
			`my-rand.output.json`,
		])

		// console.log(`process.env (cache miss test):`, process.env)
		const teardown = spawn(
			`node`,
			[`--experimental-strip-types`, `global-teardown.node.ts`],
			{
				stdio: `inherit`,
				cwd: path.join(import.meta.dirname, `isolation-cache-miss`),
				// env: { GITHUB_ACTIONS: `true` },
			},
		)
		await new Promise((resolve) => teardown.on(`exit`, resolve))
	}, 5_000)
})
