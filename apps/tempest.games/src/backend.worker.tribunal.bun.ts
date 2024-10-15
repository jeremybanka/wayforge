#!/usr/bin/env bun

import { ParentSocket } from "atom.io/realtime-server"

import { tribunal } from "./backend/tribunal/tribunal"

const parent = new ParentSocket()

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

await tribunal(`/var/log/nginx/access.log`, parent.logger)
gracefulExit()

function gracefulExit() {
	parent.logger.info(`🛬 tribunal server exiting`)
	process.exit(0)
}
