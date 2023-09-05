import * as AtomIO from "atom.io"

const LOG_LEVELS = [null, `error`, `warn`, `info`] as const
AtomIO.setLogLevel(LOG_LEVELS[3])
