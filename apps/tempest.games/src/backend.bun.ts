#!/usr/bin/env bun

import { ParentSocket } from "atom.io/realtime-server"
import { serve } from "bun"

import { worker } from "./backend.worker.ts"
import { BACKEND_PORT } from "./library/const.ts"

const parent = new ParentSocket()

const gameWorker = worker(parent, `backend.worker.game.bun`)

serve({
	port: BACKEND_PORT ?? 4444,
	async fetch(req, server) {
		const ip = server.requestIP(req)?.address ?? `??`
		parent.logger.info(`🚀`, ip, Date.now(), `<-`, req.method, req.url)
		const text = await req.text()
		if (text) {
			parent.logger.info(`📬`, { text })
		}
		switch (req.method) {
			case `GET`:
				if (req.url.endsWith(`/.env`)) {
					// researching what attackers will try for moira
					return new Response(`PASSWORD="I am a silly, silly robot."`, {
						status: 200,
					})
				}
				return new Response(null, { status: 404 })
			default:
				return new Response(null, { status: 405 })
		}
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
