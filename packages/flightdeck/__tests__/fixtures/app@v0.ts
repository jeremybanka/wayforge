#!/usr/bin/env bun

import { ParentSocket } from "atom.io/realtime-server"
import { serve } from "bun"

const PORT = process.argv[2] ?? 4444
const parentSocket = new ParentSocket(process)
const server = serve({
	port: PORT,
	fetch(req) {
		parentSocket.logger.info(`🚀`, req.method, req.url)
		return new Response(`Hello World!`)
	},
})

parentSocket.logger.info(`🚀 Server started on port ${PORT}`)
parentSocket.emit(`alive`)
parentSocket.on(`updatesReady`, () => {
	parentSocket.emit(`readyToUpdate`)
})
parentSocket.on(`timeToStop`, async () => {
	await server.stop()
	process.exit(0)
})
