import * as http from "http"
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import { cities, countries } from "./schema.node"

console.log(`Server starting...`)

const PORT = process.env.PORT || 8080
const ORIGIN = `http://localhost:${PORT}`
const DB_HOST = process.env.GITHUB_ACTION ? `postgres` : `localhost`
const DB_NAME = process.env.DB_NAME

if (DB_NAME === undefined) {
	throw new Error(`DB_NAME environment variable is not set`)
}

const main = async () => {
	const sql = postgres({
		user: `postgres`,
		host: DB_HOST,
		database: DB_NAME,
		password: `your_password`,
		port: 5432,
	})

	sql`LISTEN table_update`

	sql.listen(`notification`, (message) => {
		console.log(`Received notification: ${message}`)
	})
	const db = drizzle(sql)

	http
		.createServer((req, res) => {
			let data: Uint8Array[] = []
			req
				.on(`data`, (chunk) => {
					data.push(chunk)
				})
				.on(`end`, async () => {
					try {
						if (typeof req.url !== `string`) throw 418
						const url = new URL(req.url, ORIGIN)
						console.log({ pathname: url.pathname, method: req.method })
						switch (req.method) {
							case `GET`:
								switch (url.pathname) {
									case `/hello-world`:
										res.writeHead(200)
										res.end(`Hello from server on port ${PORT}!`)
										break
									case `/countries`: {
										const rows = await db.select().from(countries)
										res.writeHead(200, {
											"Content-Type": `application/json`,
										})
										res.end(JSON.stringify(rows))
										break
									}
									case `/cities`: {
										const rows = await db.select().from(cities)
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
