import * as AtomIO from "atom.io"
import { composeRealtimeHooks } from "atom.io/realtime-client"

import { socket } from "./socket"

const LOG_LEVELS = [null, `error`, `warn`, `info`] as const
AtomIO.setLogLevel(LOG_LEVELS[2])

export const {
  socketIdState,
  useRemoteState,
  useRemoteFamily,
  useRemoteFamilyMember,
  useRemoteTransaction,
} = composeRealtimeHooks(socket)
