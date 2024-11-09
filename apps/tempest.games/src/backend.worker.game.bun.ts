#!/usr/bin/env bun

import { ParentSocket } from "atom.io/realtime-server"

const parent = new ParentSocket()

parent.on(`timeToStop`, function gracefulExit() {
	parent.logger.info(`🛬 frontend server exiting`)
	process.exit(0)
})

parent.logger.info(`🛫 game worker ready`)
