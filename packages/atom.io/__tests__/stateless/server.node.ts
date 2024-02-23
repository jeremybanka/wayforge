import * as http from "http"
import type { Json } from "atom.io/json"
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import { cities, countries } from "./schema.node"

console.log(`Server starting...`)

const PORT = process.env.PORT || 8080
const ORIGIN = `http://localhost:${PORT}`
const DB_HOST = `localhost`
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

	await sql.listen(`table_update`, (message) => {
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
						console.log(req.method, url.pathname)
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
							case `POST`:
								{
									const text = Buffer.concat(data).toString()
									const json: Json.Serializable = JSON.parse(text)
									console.log({ json })
									switch (url.pathname) {
										case `/countries`: {
											if (
												typeof json === `object` &&
												json !== null &&
												`name` in json &&
												typeof json.name === `string`
											) {
												const { name } = json
												const rows = await db
													.insert(countries)
													.values({ name })
													.returning()
												res.writeHead(200, {
													"Content-Type": `application/json`,
												})
												console.log({ rows })
												res.end(JSON.stringify(rows))
												break
											}
											throw 400
										}
										case `/cities`: {
											if (
												typeof json === `object` &&
												json !== null &&
												`name` in json &&
												typeof json.name === `string` &&
												`countryId` in json &&
												typeof json.countryId === `number`
											) {
												const { name, countryId } = json
												const rows = await db
													.insert(cities)
													.values({ name, countryId })
													.returning()
												res.writeHead(200, {
													"Content-Type": `application/json`,
												})
												console.log({ rows })
												res.end(JSON.stringify(rows))
												break
											}
											break
										}
										default:
											throw 404
									}
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
