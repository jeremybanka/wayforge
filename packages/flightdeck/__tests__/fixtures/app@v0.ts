#!/usr/bin/env bun

import { ParentSocket } from "atom.io/realtime-server"
import { serve } from "bun"

const PORT = process.argv[2] ?? 4444
const parentSocket = new ParentSocket()
serve({
	port: PORT,
	fetch(req) {
		parentSocket.logger.info(`🚀`, req.method, req.url)
		return new Response(`Hello World!`)
	},
})

parentSocket.emit(`alive`)
parentSocket.on(`updatesReady`, () => {
	parentSocket.emit(`readyToUpdate`)
})
parentSocket.logger.info(`🚀 Server started on port ${PORT}`)
