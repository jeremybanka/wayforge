import type { ChildProcess } from "child_process"
import { spawn } from "child_process"
import http from "http"
import path from "path"

import httpProxy from "http-proxy"
import { DatabaseManager } from "./database.node"

const childProcesses: ChildProcess[] = []
const dbManager = new DatabaseManager()

beforeAll(async () => {
	// Connect and set up the database
	await dbManager.connect()
	// await dbManager.createSampleTable()
	await dbManager.setupTriggersAndNotifications()

	const NUM_SERVERS = 3 // or however many you want

	for (let i = 0; i < NUM_SERVERS; i++) {
		const port = 6260 + i
		const server = spawn(
			`pnpm`,
			[`tsx`, path.join(__dirname, `server.node.ts`)],
			{
				env: { ...process.env, PORT: `${port}` },
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

	// Wait for all servers to be ready
	await Promise.all(serversReadyPromises)
})

afterEach(async () => {
	// Reset the database state between tests
	await dbManager.resetDatabase()
})

afterAll(async () => {
	// Kill all child processes after the test
	childProcesses.forEach((child) => {
		child.kill()
	})

	// Disconnect the database
	await dbManager.disconnect()
})

describe(`multiple-instance`, () => {
	it(`runs several instances of the same server`, async () => {
		const res = await new Promise<http.IncomingMessage>((resolve) => {
			http.get(`http://localhost:8000`, (res) => {
				resolve(res)
			})
		})
		expect(res.statusCode).toBe(200)
	})
})
