#!/usr/bin/env bun

import { ParentSocket } from "atom.io/realtime-server"

import { worker } from "./backend.worker.ts"

const parent = new ParentSocket()

const gameWorker = worker(parent, `backend.worker.game.bun`)

process.on(`exit`, () => {
	gameWorker.process.kill()
	parent.logger.info(`🛬 backend server exiting`)
})

parent.logger.info(`🛫 backend server ready`)
