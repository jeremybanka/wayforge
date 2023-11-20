import type { ChildProcess } from "child_process"
import { spawn } from "child_process"
import http from "http"
import path from "path"

import httpProxy from "http-proxy"
import { DatabaseManager } from "./database.node"

const childProcesses: ChildProcess[] = []
const dbManager = new DatabaseManager()

beforeAll(async () => {
	await dbManager.createDatabase()

	const NUM_SERVERS = 3

	for (let i = 0; i < NUM_SERVERS; i++) {
		const port = 6260 + i
		const server = spawn(
			`pnpm`,
			[`tsx`, path.join(__dirname, `server.node.ts`)],
			{
				env: { ...process.env, PORT: `${port}`, DB_NAME: `${dbManager.dbName}` },
			},
		)
		childProcesses.push(server)

		server.stdout.on(`data`, (data) => {
			console.log(`[Server ${port}] ${data}`)
		})

		server.stderr.on(`data`, (data) => {
			console.error(`[Server ${port} Error] ${data}`)
		})

		server.on(`close`, (code) => {
			console.log(`Server ${port} exited with code ${code}`)
		})
	}

	const addresses = Array.from({ length: NUM_SERVERS }, (_, i) => ({
		target: `http://localhost:${6260 + i}`,
	}))

	let i = 0

	const proxy = httpProxy.createProxyServer()

	http
		.createServer((req, res) => {
			proxy.web(req, res, addresses[i])
			i = (i + 1) % addresses.length // Round-robin
		})
		.listen(8000)

	const serversReadyPromises = childProcesses.map((server, index) => {
		return new Promise((resolve) => {
			server.stdout?.on(`data`, (data) => {
				if (data.includes(`Server started on port ${6260 + index}`)) {
					resolve(true)
				}
			})
		})
	})

	await Promise.all(serversReadyPromises)
})

beforeEach(async () => {
	console.log(`Creating sample tables`)
	await dbManager.createSampleTables()
	await dbManager.insertSampleData()
	await dbManager.setupTriggersAndNotifications()
})

afterEach(async () => {
	console.log(`Dropping sample tables`)
	await dbManager.dropSampleTables()
})

afterAll(async () => {
	for (const child of childProcesses) {
		child.kill()
	}
	await dbManager.dropDatabase()
})

describe(`multiple-instance`, () => {
	it(`runs several instances of the same server`, async () => {
		const res = await fetch(`http://localhost:8000/hello-world`)
		const text = await res.text()
		console.log({ text })
		expect(text).toBe(`Hello from server on port 6260!`)
	})
	it(`gets countries`, async () => {
		const res = await fetch(`http://localhost:8000/countries`)
		const json = await res.json()
		expect(json).toEqual([
			{ id: 1, name: `USA` },
			{ id: 2, name: `Canada` },
			{ id: 3, name: `Mexico` },
		])
	})
	it(`gets cities`, async () => {
		const res = await fetch(`http://localhost:8000/cities`)
		const json = await res.json()
		expect(json).toEqual([
			{ id: 1, name: `New York`, countryId: 1, popularity: `popular` },
			{ id: 2, name: `Los Angeles`, countryId: 1, popularity: `popular` },
			{ id: 3, name: `Chicago`, countryId: 1, popularity: `known` },
			{ id: 4, name: `Toronto`, countryId: 2, popularity: `known` },
			{ id: 5, name: `Montreal`, countryId: 2, popularity: `known` },
			{ id: 6, name: `Vancouver`, countryId: 2, popularity: `known` },
			{ id: 7, name: `Mexico City`, countryId: 3, popularity: `popular` },
			{ id: 8, name: `Guadalajara`, countryId: 3, popularity: `known` },
			{ id: 9, name: `Monterrey`, countryId: 3, popularity: `known` },
		])
	})
	it(`inserts a country`, async () => {
		const res = await fetch(`http://localhost:8000/countries`, {
			method: `POST`,
			headers: { "Content-Type": `application/json` },
			body: JSON.stringify({ name: `Brazil` }),
		})
		const json = await res.json()
		expect(json).toEqual([{ id: 4, name: `Brazil` }])
	})
	it(`inserts a city`, async () => {
		const res = await fetch(`http://localhost:8000/cities`, {
			method: `POST`,
			headers: { "Content-Type": `application/json` },
			body: JSON.stringify({
				name: `Portland`,
				countryId: 1,
			}),
		})
		const json = await res.json()
		expect(json).toEqual([
			{ id: 10, name: `Portland`, countryId: 1, popularity: null },
		])
	})
})
