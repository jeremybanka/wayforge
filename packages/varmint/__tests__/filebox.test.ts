import { spawn } from "node:child_process"
import * as fs from "node:fs"
import * as http from "node:http"
import path from "node:path"

import * as tmp from "tmp"

import { Squirrel } from "../src"

let server: http.Server
let tempDir: tmp.DirResult
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
	server.listen(12500)

	tempDir = tmp.dirSync({ unsafeCleanup: true })
})
afterEach(() => {
	server.close()
	tempDir.removeCallback()
})

describe(`Filebox`, () => {
	test(`mode:off`, async () => {
		const squirrel = new Squirrel(`off`, tempDir.name)
		const responses = squirrel.add(`responses`, async (url: string) => {
			return fetch(url).then((response) => response.text())
		})
		const result = await responses.for(`home`).get(`http://localhost:12500`)
		expect(result).toBe(`The best way to predict the future is to invent it.`)
		expect(utils.put).toHaveBeenCalledTimes(1)
	})
	test(`mode:read`, async () => {
		const squirrel = new Squirrel(`read`, tempDir.name)
		const fetcher = squirrel.add(`hello`, async (url: string) => {
			return fetch(url).then((response) => response.text())
		})
		let caught: Error | undefined
		try {
			await fetcher.for(`home`).get(`http://localhost:12500`)
		} catch (thrown) {
			if (thrown instanceof Error) {
				console.error(`💥`, thrown)
				caught = thrown
			}
		} finally {
			expect(caught).toBeInstanceOf(Error)
			expect(utils.put).toHaveBeenCalledTimes(0)
		}
		fs.mkdirSync(path.join(tempDir.name, `hello`))
		fs.writeFileSync(
			path.join(tempDir.name, `hello/home.input.json`),
			`[\n\t"http://localhost:12500"\n]`,
		)
		fs.writeFileSync(
			path.join(tempDir.name, `hello/home.output.json`),
			`"The best way to predict the future is to invent it."`,
		)

		const result = await fetcher.for(`home`).get(`http://localhost:12500`)
		expect(result).toBe(`The best way to predict the future is to invent it.`)
		expect(utils.put).toHaveBeenCalledTimes(0)
	})
	test(`mode:read (cache-miss)`, async () => {
		const info: string[] = []
		const squirrel = new Squirrel(`read`, tempDir.name)
		fs.mkdirSync(path.join(tempDir.name, `hello`))
		fs.writeFileSync(
			path.join(tempDir.name, `hello/casa.input.json`),
			`[\n\t"http://localhost:12500"\n]`,
		)
		const fetcher = squirrel.add(`hello`, async (url: string) => {
			return fetch(url).then((response) => response.text())
		})
		let caught: Error | undefined
		try {
			await fetcher.for(`home`).get(`http://localhost:12500`)
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
		const setup = spawn(
			`node`,
			[`--experimental-strip-types`, `global-setup.node.ts`, tempDir.name],
			{
				stdio: `inherit`,
				cwd: path.join(import.meta.dirname, `isolation`),
			},
		)
		await new Promise((resolve) => setup.on(`exit`, resolve))
		fs.mkdirSync(path.join(tempDir.name, `other`))
		console.log(`tempDir contents:`, fs.readdirSync(tempDir.name))
		fs.writeFileSync(
			path.join(tempDir.name, `rand`, `some-random-file.whatever`),
			`{}`,
		)
		expect(fs.readdirSync(tempDir.name)).toEqual([`other`, `rand`])
		expect(fs.readdirSync(path.join(tempDir.name, `rand`))).toEqual([
			`my-rand.input.json`,
			`my-rand.output.json`,
			`some-random-file.whatever`,
		])
		const teardown = spawn(
			`node`,
			[`--experimental-strip-types`, `global-teardown.node.ts`],
			{
				stdio: `inherit`,
				cwd: path.join(import.meta.dirname, `isolation`),
			},
		)
		await new Promise((resolve) => teardown.on(`exit`, resolve))
		expect(fs.readdirSync(tempDir.name)).toEqual([`rand`])
		expect(fs.readdirSync(path.join(tempDir.name, `rand`))).toEqual([
			`my-rand.input.json`,
			`my-rand.output.json`,
		])
	})
})
