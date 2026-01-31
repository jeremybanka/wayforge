#!/usr/bin/env bun

import path, { join, normalize, resolve } from "node:path"

import { type } from "arktype"
import { discoverType } from "atom.io/introspection"
import type { Json } from "atom.io/json"
import { ParentSocket } from "atom.io/realtime-server"
import { file, serve } from "bun"

import { httpsDev } from "../dev/https-dev"
import { DatabaseManager } from "./database/tempest-db-manager"
import { env } from "./library/env"
import {
	RESPONSE_DICTIONARY,
	serverIssueType,
} from "./library/response-dictionary"

const parentSocket = new ParentSocket(process)
const { logger } = parentSocket
Object.assign(console, logger, { log: logger.info })
logger.info(`ready`)
const appDir = resolve(import.meta.dir, `..`, `app`)

const db = new DatabaseManager({
	logQuery(query, params) {
		logger.info(`📝 query`, query, params as Json.Serializable)
	},
})

serve({
	hostname: `0.0.0.0`,
	port: env.FRONTEND_PORT ?? 3333,
	...(httpsDev ?? undefined),
	async fetch(req) {
		try {
			const now = new Date()
			const url = new URL(req.url)
			logger.info(req.method, url.pathname)

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
				// eslint-disable-next-line @typescript-eslint/only-throw-error
				throw [403, `Access Denied`]
			}

			const fileExists = await file(normalizedPath).exists()
			if (!fileExists) {
				return new Response(Bun.file(resolve(appDir, `index.html`)))
			}
			return new Response(file(normalizedPath))
		} catch (thrown) {
			const result = serverIssueType(thrown)
			if (result instanceof type.errors === false) {
				const [code, message] = result
				const codeMeaning = RESPONSE_DICTIONARY[code]
				const responseText = `${codeMeaning}. ${message}`
				logger.info(`❌ ${code}: ${responseText}`)
				return new Response(responseText, { status: code })
			}
			if (thrown instanceof Error) {
				logger.error(thrown.message)
			} else {
				const thrownType = discoverType(thrown)
				logger.error(`frontend server threw`, thrownType)
			}
			return new Response(RESPONSE_DICTIONARY[500], { status: 500 })
		}
	},
})

function gracefulExit() {
	logger.info(`🛬 frontend server exiting`)
	process.exit(0)
}

process.on(`SIGINT`, () => {
	logger.info(`❗ received SIGINT; exiting gracefully`)
	gracefulExit()
})
process.on(`SIGTERM`, () => {
	logger.info(`❗ received SIGTERM; exiting gracefully`)
	gracefulExit()
})
process.on(`exit`, () => {
	logger.info(`❗ received exit; exiting gracefully`)
	gracefulExit()
})

parentSocket.on(`timeToStop`, () => {
	logger.info(
		`❗ backend server received signal "timeToStop"; exiting gracefully`,
	)
	gracefulExit()
})

const { version } = await Bun.file(
	path.resolve(import.meta.dir, `../package.json`),
).json()
logger.info(
	`🛫 frontend v${version} running at http://localhost:${env.FRONTEND_PORT}/`,
)
parentSocket.emit(`alive`)
