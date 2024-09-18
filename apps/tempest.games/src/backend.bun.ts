#!/usr/bin/env bun

import { ParentSocket } from "atom.io/realtime-server"
import { serve } from "bun"

import { worker } from "./backend.worker.ts"
import { BACKEND_PORT } from "./library/const.ts"

const parent = new ParentSocket()

const gameWorker = worker(parent, `backend.worker.game.bun`)

serve({
	port: BACKEND_PORT ?? 4444,
	async fetch(req) {
		parent.logger.info(`🚀`, req.method, req.url)
		const text = await req.text()
		if (text) {
			parent.logger.info(`📬`, { text })
		}
		return new Response(`Welcome!`)
	},
})

parent.emit(`alive`)
parent.on(`updatesReady`, () => {
	parent.emit(`readyToUpdate`)
})

process.on(`exit`, () => {
	gameWorker.process.kill()
	parent.logger.info(`🛬 backend server exiting`)
})

parent.logger.info(`🛫 backend server ready`)
