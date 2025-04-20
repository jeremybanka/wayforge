import { AtomIOLogger } from "atom.io"
import { IMPLICIT } from "atom.io/internal"
import { ParentSocket } from "atom.io/realtime-server"

import { env } from "../library/env"

export const parentSocket = new ParentSocket()

export const logger = (
	env.RUN_WORKERS_FROM_SOURCE ? console : parentSocket.logger
) satisfies Pick<Console, `error` | `info` | `warn`>
IMPLICIT.STORE.loggers[0] = new AtomIOLogger(`warn`, undefined, logger)

if (logger !== console) {
	Object.assign(console, logger, { log: logger.info })
}
