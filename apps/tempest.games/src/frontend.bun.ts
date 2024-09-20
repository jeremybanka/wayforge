#!/usr/bin/env bun

import { join, normalize, resolve } from "node:path"

import { discoverType } from "atom.io/introspection"
import { ParentSocket } from "atom.io/realtime-server"
import { file, serve } from "bun"

import { env } from "./library/env"
import { RESPONSE_DICTIONARY } from "./library/response-dictionary"

const parent = new ParentSocket()
parent.logger.info(` ready`)
const appDir = resolve(import.meta.dir, `..`, `app`)

serve({
	port: env.FRONTEND_PORT ?? 3333,
	async fetch(req, server) {
		try {
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
				throw 403
			}

			const fileExists = await file(normalizedPath).exists()
			if (!fileExists) {
				throw 404
			}
			return new Response(file(normalizedPath))
		} catch (thrown) {
			if (typeof thrown === `number`) {
				return new Response(RESPONSE_DICTIONARY[thrown], { status: thrown })
			}
			if (thrown instanceof Error) {
				parent.logger.error(thrown.message)
			} else {
				const thrownType = discoverType(thrown)
				parent.logger.error(`frontend server threw`, thrownType)
			}
			return new Response(RESPONSE_DICTIONARY[500], { status: 500 })
		}
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
	`🛫 frontend server running at http://localhost:${env.FRONTEND_PORT ?? 3333}/`,
)
