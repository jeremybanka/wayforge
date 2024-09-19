#!/usr/bin/env bun

import { join, normalize, resolve } from "node:path"

import { ParentSocket } from "atom.io/realtime-server"
import { file, serve } from "bun"

import { FRONTEND_PORT } from "./library/const"

const parent = new ParentSocket()
parent.logger.info(` ready`)
const appDir = resolve(import.meta.dir, `..`, `app`)

serve({
	port: FRONTEND_PORT ?? 3333,
	async fetch(req, server) {
		const url = new URL(req.url)

		const ip = server.requestIP(req)?.address ?? `??`
		parent.logger.info(`[${ip}]`, req.method, url.pathname)

		if (url.pathname === `/`) {
			return new Response(Bun.file(resolve(appDir, `index.html`)))
		}
		if (url.pathname === `/index.html`) {
			return Response.redirect(`/`)
		}
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

function gracefulExit() {
	parent.logger.info(`🛬 frontend server exiting`)
	process.exit(0)
}

process.on(`SIGINT`, () => {
	parent.logger.info(`❗ received SIGINT; exiting gracefully`)
	gracefulExit()
})
process.on(`SIGTERM`, () => {
	parent.logger.info(`❗ received SIGTERM; exiting gracefully`)
	gracefulExit()
})
process.on(`exit`, () => {
	parent.logger.info(`❗ received exit; exiting gracefully`)
	gracefulExit()
})
parent.logger.info(
	`🛫 frontend server running at http://localhost:${FRONTEND_PORT ?? 3333}/`,
)
