#!/usr/bin/env bun

import { ParentSocket } from "atom.io/realtime-server"
import { serve } from "bun"

const PORT = 4444
const parentSocket = new ParentSocket()
serve({
	port: PORT,
	fetch(req) {
		parentSocket.logger.info(`🚀`, req.method, req.url)
		return new Response(`I can see my house from here!`)
	},
})

parentSocket.emit(`alive`)
parentSocket.on(`updatesReady`, () => {
	parentSocket.emit(`readyToUpdate`)
})
