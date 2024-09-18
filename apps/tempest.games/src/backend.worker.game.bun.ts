#!/usr/bin/env bun

import { ParentSocket } from "atom.io/realtime-server"

const parent = new ParentSocket()

process.on(`exit`, () => {
	parent.logger.info(`🛬 game worker exiting`)
})
parent.logger.info(`🛫 game worker ready`)
