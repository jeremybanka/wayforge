#!/usr/bin/env bun

import { ParentSocket } from "atom.io/realtime-server"

const parent = new ParentSocket()

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
parent.logger.info(`🛫 tribunal worker ready`)
