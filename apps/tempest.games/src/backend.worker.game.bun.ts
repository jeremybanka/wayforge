#!/usr/bin/env bun

import { ParentSocket } from "atom.io/realtime-server"

const parent = new ParentSocket()
parent.logger.info(`🚀`, `hello from game worker`)

process.on(`exit`, () => {
	parent.logger.info(`🚀`, `goodbye from game worker`)
})
