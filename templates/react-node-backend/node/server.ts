#!/usr/bin/env node --watch

import * as http from "node:http"
import { DatabaseSync } from "node:sqlite"

const PORT = process.env.PORT ?? 3000
const SERVER_ORIGIN = `http://localhost:3000`
const FRONTEND_ORIGIN = `http://localhost:5173`

const db = new DatabaseSync(`:memory:`)
db.exec(`
  CREATE TABLE todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT NOT NULL,
    done INTEGER DEFAULT 0
  )
`)

const insertStmt = db.prepare(`INSERT INTO todos (text) VALUES (?)`)
const getAllStmt = db.prepare(`SELECT * FROM todos ORDER BY id`)
const getOneStmt = db.prepare(`SELECT * FROM todos WHERE id = ?`)
const updateStmt = db.prepare(`UPDATE todos SET done = ? WHERE id = ?`)
const deleteStmt = db.prepare(`DELETE FROM todos WHERE id = ?`)

function parseCookies(cookieHeader = ``) {
	return Object.fromEntries(
		cookieHeader
			.split(`;`)
			.map((c) => c.trim().split(`=`))
			.filter(([k, v]) => k && v),
	)
}

function sendJSON(
	res: http.ServerResponse,
	status: number,
	data: any,
	cors = false,
) {
	const body = JSON.stringify(data)
	const headers: http.OutgoingHttpHeaders = {
		"Content-Type": `application/json`,
		"Content-Length": Buffer.byteLength(body),
	}
	if (cors) {
		headers[`Access-Control-Allow-Origin`] = FRONTEND_ORIGIN
		headers[`Access-Control-Allow-Credentials`] = `true`
	}
	res.writeHead(status, headers)
	res.end(body)
}

const server = http.createServer(async (req, res) => {
	try {
		const r = req as http.IncomingMessage & { url: string; method: string }

		const { pathname, searchParams } = new URL(r.url, SERVER_ORIGIN)

		console.log(r.method, pathname, [...searchParams.entries()])

		const cookies = parseCookies(r.headers.cookie)

		if (req.method === `OPTIONS`) {
			res.writeHead(204, {
				"Access-Control-Allow-Origin": FRONTEND_ORIGIN,
				"Access-Control-Allow-Credentials": `true`,
				"Access-Control-Allow-Methods": `GET,POST,PUT,DELETE,OPTIONS`,
				"Access-Control-Allow-Headers": `Content-Type`,
			})
			return res.end()
		}

		// eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
		switch (pathname) {
			case `/redirect`:
				{
					const token = searchParams.get(`token`)
					if (typeof token !== `string`) {
						sendJSON(res, 400, { error: `Missing token` })
						return
					}
					res.writeHead(302, {
						"Set-Cookie": `auth_token=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=1000`,
						"Access-Control-Allow-Origin": FRONTEND_ORIGIN,
						"Access-Control-Allow-Credentials": `true`,
						Location: FRONTEND_ORIGIN,
					})
					res.end()
				}
				return
			case `/random`:
				{
					await new Promise((resolve) => setTimeout(resolve, 1000))
					const token = cookies[`auth_token`]
					if (!token) {
						sendJSON(res, 401, { error: `Unauthenticated` }, true)
						return
					}

					const random = Math.floor(Math.random() * 100)
					sendJSON(res, 200, random, true)
				}
				return
			case `/todos`:
				{
					await new Promise((resolve) => setTimeout(resolve, 2000))
					const token = cookies[`auth_token`]
					if (!token) {
						sendJSON(res, 401, { error: `Unauthenticated` }, true)
						return
					}
					switch (r.method) {
						case `GET`:
							{
								const id = Number.parseInt(searchParams.get(`id`) as string, 10)
								if (Number.isNaN(id)) {
									sendJSON(res, 200, { todos: getAllStmt.all() }, true)
								} else {
									const todo = getOneStmt.get(id)
									sendJSON(res, 200, { todo }, true)
								}
							}
							return
						case `POST`:
							{
								let body = ``
								for await (const chunk of r) body += chunk
								const { lastInsertRowid } = insertStmt.run(body)
								const todo = getOneStmt.get(lastInsertRowid)
								sendJSON(res, 200, { todo }, true)
							}
							return
						case `PUT`:
							{
								const id = Number.parseInt(searchParams.get(`id`) as string, 10)
								if (Number.isNaN(id)) {
									sendJSON(res, 400, { error: `Invalid id` }, true)
									return
								}
								let body = ``
								for await (const chunk of r) body += chunk
								const nowChecked = JSON.parse(body)
								updateStmt.run(nowChecked, id)
								sendJSON(res, 200, { success: true }, true)
							}
							return
						case `DELETE`:
							{
								const id = Number.parseInt(searchParams.get(`id`) as string, 10)
								deleteStmt.run(id)
								sendJSON(res, 200, { success: true }, true)
							}
							return
						default:
							sendJSON(res, 405, { error: `Method not allowed` }, true)
					}
				}
				return

			case `/logout`:
				{
					res.writeHead(302, {
						"Set-Cookie": `auth_token=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`,
						"Access-Control-Allow-Origin": FRONTEND_ORIGIN,
						"Access-Control-Allow-Credentials": `true`,
						Location: FRONTEND_ORIGIN,
					})
					res.end()
				}
				return
		}

		sendJSON(res, 404, { error: `Not found` })
	} catch (thrown) {
		console.error(thrown)
		sendJSON(res, 500, null, true)
	}
})

// Start server
server.listen(PORT, () => {
	console.log(`Server running at http://localhost:${PORT}`)
})
