import * as http from "http"

import { Client } from "pg"

console.log(`Server starting...`)

const PORT = process.env.PORT || 8080

const main = async () => {
	// Database connection and cache invalidation setup
	const client = new Client({
		user: `postgres`, // Default user; adjust if needed
		host: process.env.GITHUB_ACTION ? `postgres` : `localhost`,
		database: `postgres`, // Default database to execute administrative commands
		password: `your_password`, // Set your postgres user's password
		port: 5432,
	})
	await client.connect()
	await client.query(`LISTEN table_update`)

	client.on(`notification`, (message) => {
		if (message.channel === `table_update` && message.payload) {
			const [tableName, id] = message.payload.split(`,`)
			// Invalidate cache for the given table and ID
		}
	})

	http
		.createServer((_, res) => {
			res.writeHead(200)
			res.end(`Hello from server on port ${PORT}!`)
		})
		.listen(PORT, () => {
			console.log(`Server started on port ${PORT}`)
		})
}
main()
