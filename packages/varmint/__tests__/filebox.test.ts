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
	server.listen(12500)

	tempDir = fs.mkdtempSync(path.join(tmpdir(), `varmint-`))
})
afterEach(() => {
	server.close()
	fs.rmSync(tempDir, { recursive: true, force: true })
})

describe(`Filebox`, () => {
	test(`mode:off`, async () => {
		const squirrel = new Squirrel(`off`, tempDir)
		const responses = squirrel.add(`responses`, async (url: string) => {
			return fetch(url).then((response) => response.text())
		})
		const result = await responses.for(`home`).get(`http://localhost:12500`)
		expect(result).toBe(`The best way to predict the future is to invent it.`)
		expect(utils.put).toHaveBeenCalledTimes(1)
	})
	test(`mode:read`, async () => {
		const squirrel = new Squirrel(`read`, tempDir)
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
		fs.mkdirSync(path.join(tempDir, `hello`))
		fs.writeFileSync(
			path.join(tempDir, `hello/home.input.json`),
			`[\n\t"http://localhost:12500"\n]`,
		)
		fs.writeFileSync(
			path.join(tempDir, `hello/home.output.json`),
			`"The best way to predict the future is to invent it."`,
		)

		const result = await fetcher.for(`home`).get(`http://localhost:12500`)
		expect(result).toBe(`The best way to predict the future is to invent it.`)
		expect(utils.put).toHaveBeenCalledTimes(0)
	})
})
