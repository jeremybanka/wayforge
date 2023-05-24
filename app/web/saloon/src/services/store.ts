import { useState, useEffect } from "react"

import { __INTERNAL__, setLogLevel } from "atom.io"
import { composeStoreHooks } from "atom.io/react"
import { composeDevtools } from "atom.io/react-devtools"

// console.log(`d`, d)

const storeHooks = composeStoreHooks({ useState, useEffect })

export const { Devtools } = composeDevtools({ storeHooks })

export const { useStore, useO, useIO, useI } = storeHooks

const LOG_LEVELS = [null, `error`, `warn`, `info`] as const
setLogLevel(LOG_LEVELS[3])
