#!/usr/bin/env bun

import { ParentSocket } from "atom.io/realtime-server"

const parent = ((process as any).parentSocket ??= new ParentSocket(process))
Object.assign(console, parent.logger, { log: parent.logger.info })

parent.on(`timeToStop`, function gracefulExit() {
	parent.logger.info(`🛬 game worker exiting`)
	process.exit(0)
})

parent.logger.info(`🛫 game worker ready`)
