import type { ChildProcess } from "node:child_process"
import { spawn } from "node:child_process"
import type { IncomingHttpHeaders, Server } from "node:http"
import http from "node:http"
import path from "node:path"

import { DatabaseManager } from "./database.node"

console.log = () => undefined
console.warn = () => undefined
console.error = () => undefined

const childProcesses: ChildProcess[] = []
const dbManager = new DatabaseManager()
let proxyServer: Server | undefined

const filterHopByHopHeaders = (headers: IncomingHttpHeaders) => {
	const {
		connection,
		"keep-alive": keepAlive,
		"proxy-authenticate": proxyAuthenticate,
		"proxy-authorization": proxyAuthorization,
		te,
		trailer,
		"transfer-encoding": transferEncoding,
		upgrade,
		...filtered
	} = headers
	return filtered
}

const createRoundRobinProxyServer = (targets: string[]) => {
	let targetIndex = 0

	return http.createServer((req, res) => {
		const target = new URL(req.url ?? `/`, targets[targetIndex])
		targetIndex = (targetIndex + 1) % targets.length

		const proxyReq = http.request(
			target,
			{
				headers: filterHopByHopHeaders(req.headers),
				method: req.method,
			},
			(proxyRes) => {
				res.writeHead(
					proxyRes.statusCode ?? 502,
					proxyRes.statusMessage,
					filterHopByHopHeaders(proxyRes.headers),
				)
				proxyRes.pipe(res)
			},
		)

		proxyReq.on(`error`, (error) => {
			if (!res.headersSent) {
				res.writeHead(502, { "content-type": `text/plain` })
			}
			res.end(`Proxy request failed: ${error.message}`)
		})

		req.on(`aborted`, () => {
			proxyReq.destroy()
		})

		req.pipe(proxyReq)
	})
}

beforeAll(async () => {
	await dbManager.createDatabase()

	const NUM_SERVERS = 3

	for (let i = 0; i < NUM_SERVERS; i++) {
		const port = 6260 + i
		const server = spawn(`bun`, [path.join(__dirname, `server.node.ts`)], {
			env: { ...process.env, PORT: `${port}`, DB_NAME: dbManager.dbName },
		})
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

	const addresses = Array.from(
		{ length: NUM_SERVERS },
		(_, i) => `http://localhost:${6260 + i}`,
	)

	proxyServer = createRoundRobinProxyServer(addresses).listen(8000)

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
	await new Promise<void>((resolve, reject) => {
		if (!proxyServer) {
			resolve()
			return
		}
		proxyServer.close((error) => {
			if (error) {
				reject(error)
			} else {
				resolve()
			}
		})
	})
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
