import { ParentSocket } from "atom.io/realtime-server"

import { env } from "../library/env"

export const parentSocket = ((process as any).parentSocket ??= new ParentSocket(
	process,
))

export const logger = (
	env.RUN_WORKERS_FROM_SOURCE ? console : parentSocket.logger
) satisfies Pick<Console, `error` | `info` | `warn`>

if (logger !== console) {
	Object.assign(console, logger, { log: logger.info })
}
