import { useState, useEffect } from "react"

import {
  __INTERNAL__,
  atom,
  selector,
  setLogLevel,
  transaction,
} from "~/packages/atom.io/src"
import { composeStoreHooks } from "~/packages/atom.io/src/react"
import { composeDevtools } from "~/packages/atom.io/src/react-devtools/AtomIODevtools"
import { composeExplorer } from "~/packages/atom.io/src/react-explorer/AtomIOExplorer"
import { timeline } from "~/packages/atom.io/src/timeline"

const storeHooks = composeStoreHooks({ useState, useEffect })

// export const { Devtools } = composeDevtools({ storeHooks })

export const { useStore, useO, useIO, useI } = storeHooks

console.log(__INTERNAL__.IMPLICIT)

const LOG_LEVELS = [null, `error`, `warn`, `info`] as const
setLogLevel(LOG_LEVELS[3])
