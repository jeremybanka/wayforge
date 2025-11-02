#!/usr/bin/env node

import * as http from "node:http"
import { parse as parseUrl } from "node:url"

const PORT = process.env.PORT ?? 3000
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN ?? "http://localhost:5173"

function parseCookies(cookieHeader = "") {
	return Object.fromEntries(
		cookieHeader
			.split(";")
			.map((c) => c.trim().split("="))
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
		"Content-Type": "application/json",
		"Content-Length": Buffer.byteLength(body),
	}
	if (cors) {
		headers["Access-Control-Allow-Origin"] = FRONTEND_ORIGIN
		headers["Access-Control-Allow-Credentials"] = "true"
	}
	res.writeHead(status, headers)
	res.end(body)
}

const server = http.createServer(async (req, res) => {
	const r = req as http.IncomingMessage & { url: string; method: string }

	const { pathname, query } = parseUrl(r.url, true)

	console.log(r.method, pathname, { ...query })

	const cookies = parseCookies(r.headers.cookie)

	if (req.method === "OPTIONS") {
		res.writeHead(204, {
			"Access-Control-Allow-Origin": FRONTEND_ORIGIN,
			"Access-Control-Allow-Credentials": "true",
			"Access-Control-Allow-Methods": "GET,POST,OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type",
		})
		return res.end()
	}

	switch (pathname) {
		case "/redirect": {
			const token = query.token
			if (!token) {
				return sendJSON(res, 400, { error: "Missing token" })
			}

			res.writeHead(302, {
				"Set-Cookie": `auth_token=${token}; HttpOnly; Path=/; SameSite=Lax`,
				"Access-Control-Allow-Origin": FRONTEND_ORIGIN,
				"Access-Control-Allow-Credentials": "true",
				Location: FRONTEND_ORIGIN,
			})
			return res.end()
		}
		case "/random": {
			await new Promise((resolve) => setTimeout(resolve, 1000))
			const token = cookies["auth_token"]
			console.log({ token })
			if (!token) {
				return sendJSON(res, 401, { error: "Unauthenticated" }, true)
			}

			const random = Math.floor(Math.random() * 100)
			return sendJSON(res, 200, random, true)
		}
		case "/logout": {
			res.writeHead(302, {
				"Set-Cookie": `auth_token=null; HttpOnly; Path=/; SameSite=None`,
				"Access-Control-Allow-Origin": FRONTEND_ORIGIN,
				"Access-Control-Allow-Credentials": "true",
				Location: FRONTEND_ORIGIN,
			})
			return res.end()
		}
	}

	sendJSON(res, 404, { error: "Not found" })
})

// Start server
server.listen(PORT, () => {
	console.log(`Server running at http://localhost:${PORT}`)
})
