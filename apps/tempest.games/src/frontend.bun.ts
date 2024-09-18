import { join, normalize, resolve } from "node:path"

import { ParentSocket } from "atom.io/realtime-server"
import { file, serve } from "bun"

const parent = new ParentSocket()
parent.logger.info(` ready`)
const appDir = resolve(import.meta.dir, `..`, `app`)

// Create the HTTP server using Bun
serve({
	port: process.env.PORT ?? 8080,
	static: {
		"/": new Response(await Bun.file(resolve(appDir, `index.html`)).bytes(), {
			headers: {
				"Content-Type": `text/html`,
			},
		}),
	},
	async fetch(req, server) {
		const url = new URL(req.url)

		const ip = server.requestIP(req)?.address ?? `??`
		parent.logger.info(`[${ip}]`, req.method, url.pathname)

		// Normalize the requested path and prevent path traversal
		const filePath = join(appDir, url.pathname)
		const normalizedPath = normalize(filePath)

		// Ensure the requested path is still within distDir
		if (!normalizedPath.startsWith(appDir)) {
			return new Response(`403: Forbidden`, { status: 403 })
		}

		const exists = await file(normalizedPath).exists()
		return exists
			? new Response(file(normalizedPath))
			: new Response(`404: Not Found`, { status: 404 })
	},
})

process.on(`exit`, () => {
	parent.logger.info(`🛬 frontend server exiting`)
})
parent.logger.info(
	`🛫 frontend server running at http://localhost:${process.env.FRONTEND_PORT ?? 3333}/`,
)
