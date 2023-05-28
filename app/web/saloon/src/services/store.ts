import { __INTERNAL__, setLogLevel } from "atom.io"

const LOG_LEVELS = [null, `error`, `warn`, `info`] as const
setLogLevel(LOG_LEVELS[3])
