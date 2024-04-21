import * as fs from "node:fs"
import * as http from "node:http"
import path from "node:path"

import { OpenAI } from "openai"
import * as tmp from "tmp"

import { Filebox } from "../src"

const openAiClient = new OpenAI({
	apiKey: import.meta.env.VITE_OPENAI_API_KEY,
	dangerouslyAllowBrowser: process.env.NODE_ENV === `test`,
})

let server: http.Server
let tempDir: tmp.DirResult
const utils = { put: (..._: unknown[]) => undefined }

beforeEach(() => {
	vitest.spyOn(utils, `put`)

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
		const filebox = new Filebox(`off`, tempDir.name)
		const responses = filebox.add({
			key: `responses`,
			get: async (url: string) => {
				return fetch(url).then((response) => response.text())
			},
		})
		const result = await responses.get(`home`, `http://localhost:12500`)
		expect(result).toBe(`The best way to predict the future is to invent it.`)
		expect(utils.put).toHaveBeenCalledTimes(1)
	})
	test(`mode:read`, async () => {
		const filebox = new Filebox(`read`, tempDir.name)
		const { get } = filebox.add({
			key: `hello`,
			get: async (url: string) => {
				return fetch(url).then((response) => response.text())
			},
		})
		let caught: Error | undefined
		try {
			await get(`home`, `http://localhost:12500`)
		} catch (thrown) {
			if (thrown instanceof Error) {
				caught = thrown
			}
		} finally {
			expect(caught).toBeInstanceOf(Error)
			expect(utils.put).toHaveBeenCalledTimes(0)
		}
		fs.writeFileSync(
			path.join(tempDir.name, `hello.home.input.json`),
			`[\n\t"http://localhost:12500"\n]`,
		)
		fs.writeFileSync(
			path.join(tempDir.name, `hello.home.output.json`),
			`"The best way to predict the future is to invent it."`,
		)

		const result = await get(`home`, `http://localhost:12500`)
		expect(result).toBe(`The best way to predict the future is to invent it.`)
		expect(utils.put).toHaveBeenCalledTimes(0)
	})
	test(`mode:read-write`, async () => {
		const filebox = new Filebox(`read-write`)
		const completions = filebox.add({
			key: `openai`,
			get: openAiClient.chat.completions.create.bind(
				openAiClient.chat.completions,
			),
		})
		const completion = await completions.get(`french-capital`, {
			model: `gpt-3.5-turbo`,
			messages: [
				{
					role: `system`,
					content: `You are a helpful assistant.`,
				},
				{
					role: `user`,
					content: `What is the capital of France?`,
				},
			],
		})
		expect(completion.choices[0].message.content).toBe(
			`The capital of France is Paris.`,
		)
	})
})
