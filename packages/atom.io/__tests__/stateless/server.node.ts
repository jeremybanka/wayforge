import * as http from "http"

import { Client } from "pg"

console.log(`Server starting...`)

const DB_NAME = process.env.DB_NAME
const DB_HOST = process.env.GITHUB_ACTION ? `postgres` : `localhost`
const PORT = process.env.PORT || 8080
const ORIGIN = `http://localhost:${PORT}`

const main = async () => {
	// Database connection and cache invalidation setup
	const client = new Client({
		user: `postgres`, // Default user; adjust if needed
		host: DB_HOST,
		database: DB_NAME, // Default database to execute administrative commands
		password: `your_password`, // Set your postgres user's password
		port: 5432,
	})
	await client.connect()
	await client.query(`LISTEN table_update`)

	client.on(`notification`, (message) => {
		if (message.channel === `table_update` && message.payload) {
			console.log(`Received notification: ${message.payload}`)
			const [tableName, id] = message.payload.split(`,`)
			// Invalidate cache for the given table and ID
		}
	})

	http
		.createServer((req, res) => {
			let data: Uint8Array[] = []
			req
				.on(`data`, (chunk) => {
					data.push(chunk)
				})
				.on(`end`, async () => {
					const authHeader = req.headers.authorization
					try {
						// if (authHeader !== `Bearer MY_BEARER_TOKEN`) throw 401
						if (typeof req.url !== `string`) throw 418
						const url = new URL(req.url, ORIGIN)
						console.log({ pathname: url.pathname, method: req.method })
						switch (req.method) {
							case `GET`:
								switch (url.pathname) {
									case `/`:
										res.writeHead(200)
										res.end(`Hello from server on port ${PORT}!`)
										break
									case `/get`: {
										console.log(`GET /get`)
										// let's get all rows
										const { rows } = await client.query(
											`SELECT * FROM your_table`,
										)
										console.log({ rows })
										res.writeHead(200, {
											"Content-Type": `application/json`,
										})
										res.end(JSON.stringify(rows))
										break
									}
									default:
										throw 404
								}
								break
							default:
								throw 405
						}
					} catch (thrown) {
						console.error(thrown)
						if (typeof thrown === `number`) {
							res.writeHead(thrown)
							res.end()
						}
					} finally {
						data = []
					}
				})
		})
		.listen(PORT, () => {
			console.log(`Server started on port ${PORT}`)
		})
}
main()
