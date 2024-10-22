#!/usr/bin/env bun

import { join, normalize, resolve } from "node:path"

import { discoverType } from "atom.io/introspection"
import { ParentSocket } from "atom.io/realtime-server"
import { file, serve } from "bun"
import { eq } from "drizzle-orm"

import { httpsDev } from "../dev/https-dev"
import { DatabaseManager } from "./database/tempest-db-manager"
import { banishedIps } from "./database/tempest-db-schema"
import { env } from "./library/env"
import {
	RESPONSE_DICTIONARY,
	serverIssueSchema,
} from "./library/response-dictionary"

const parent = new ParentSocket()
parent.logger.info(` ready`)
const appDir = resolve(import.meta.dir, `..`, `app`)

const db = new DatabaseManager()

serve({
	hostname: `0.0.0.0`,
	port: env.FRONTEND_PORT ?? 3333,
	...(httpsDev ?? undefined),
	async fetch(req, server) {
		try {
			const now = new Date()
			const url = new URL(req.url)
			const ipAddress = server.requestIP(req)?.address ?? `??`
			parent.logger.info(now, ipAddress, req.method, url.pathname)

			const [ban] = await db.drizzle
				.select({
					banishedUntil: banishedIps.banishedUntil,
				})
				.from(banishedIps)
				.where(eq(banishedIps.ip, ipAddress))
				.limit(1)
			const ipBannedIndefinitely = ban?.banishedUntil === null
			const ipBannedTemporarily = ban?.banishedUntil && ban.banishedUntil > now
			if (ipBannedIndefinitely || ipBannedTemporarily) {
				parent.logger.info(`🙅 request from banned ip ${ipAddress}`)
				throw [403, ipAddress]
			}

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
				throw [403, `Access Denied`]
			}

			const fileExists = await file(normalizedPath).exists()
			if (!fileExists) {
				return Response.redirect(`/`)
			}
			return new Response(file(normalizedPath))
		} catch (thrown) {
			const result = serverIssueSchema.safeParse(thrown)
			if (result.success) {
				const [code, message] = result.data
				const codeMeaning = RESPONSE_DICTIONARY[code]
				const responseText = `${codeMeaning}. ${message}`
				parent.logger.info(`❌ ${code}: ${responseText}`)
				return new Response(responseText, { status: code })
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
