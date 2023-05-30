import * as AtomIO from "atom.io"

import { initConnectionState, socket } from "./socket"

const LOG_LEVELS = [null, `error`, `warn`, `info`] as const
AtomIO.setLogLevel(LOG_LEVELS[2])

export const {
  socketIdState,
  useRemoteState,
  useRemoteFamily,
  useRemoteTransaction,
} = initConnectionState(socket)
