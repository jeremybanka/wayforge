import { useState, useEffect } from "react"

import { __INTERNAL__, setLogLevel } from "~/packages/atom.io/src"
import { composeStoreHooks } from "~/packages/atom.io/src/react"
import { composeDevtools } from "~/packages/atom.io/src/react-devtools/AtomIODevtools"

// console.log(`d`, d)

const storeHooks = composeStoreHooks({ useState, useEffect })

export const { Devtools } = composeDevtools({ storeHooks })

export const { useStore, useO, useIO, useI } = storeHooks

const LOG_LEVELS = [null, `error`, `warn`, `info`] as const
setLogLevel(LOG_LEVELS[2])
