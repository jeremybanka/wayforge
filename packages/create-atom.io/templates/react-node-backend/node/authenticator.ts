#!/usr/bin/env node

import http from "http"
import { parse as parseUrl } from "url"

const PORT = 4000
const BACKEND_REDIRECT_URL = `http://localhost:3000/redirect`

const server = http.createServer((req, res) => {
	const r = req as http.IncomingMessage & { url: string; method: string }
	const { pathname, query } = parseUrl(r.url, true)

	if (pathname === `/login` && r.method === `GET`) {
		const html = `
      <html>
        <body style="font-family: sans-serif; text-align: center; margin-top: 50px;">
          <h1>Mock Auth Provider</h1>
          <form action="${BACKEND_REDIRECT_URL}" method="get">
            <input type="hidden" name="token" value="SECRET" />
            <button type="submit" style="font-size: 1.2em;">Sign in</button>
          </form>
        </body>
      </html>
    `
		res.writeHead(200, { "Content-Type": `text/html` })
		return res.end(html)
	}

	// --- /validate route ---
	if (pathname === `/validate` && r.method === `GET`) {
		const token = query.token
		if (token === `SECRET`) {
			res.writeHead(200, { "Content-Type": `application/json` })
			return res.end(JSON.stringify({ valid: true, user: `mock-user` }))
		}
		res.writeHead(401, { "Content-Type": `application/json` })
		return res.end(JSON.stringify({ valid: false, error: `Invalid token` }))
	}

	// --- fallback 404 ---
	res.writeHead(404, { "Content-Type": `application/json` })
	res.end(JSON.stringify({ error: `Not found` }))
})

server.listen(PORT, () => {
	console.log(`Mock authenticator running at http://localhost:${PORT}`)
})
