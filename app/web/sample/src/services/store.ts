import { atom, selector, setLogLevel, transaction } from "~/packages/atom.io/src"
import { composeStoreHooks } from "~/packages/atom.io/src/react"
import { composeDevtools } from "~/packages/atom.io/src/react-devtools/AtomIODevtools"
import { composeExplorer } from "~/packages/atom.io/src/react-explorer/AtomIOExplorer"
import { timeline } from "~/packages/atom.io/src/timeline"

const storeHooks = composeStoreHooks()

export const { Devtools } = composeDevtools({ storeHooks })
export const { Explorer, useSetTitle } = composeExplorer({
  key: `🤓`,
  storeHooks,
})

export const { useO, useIO, useI } = storeHooks

const LOG_LEVELS = [null, `error`, `warn`, `info`] as const
setLogLevel(LOG_LEVELS[3])

export const dividendState = atom<number>({
  key: `dividend`,
  default: 1,
})

export const divisorState = atom<number>({
  key: `divisor`,
  default: 2,
})

export const quotientState = selector<number>({
  key: `quotient`,
  get: ({ get }) => {
    const divisor = get(divisorState)
    const dividend = get(dividendState)
    return dividend / divisor
  },
  set: ({ get, set }, newValue) => {
    const divisor = get(divisorState)
    set(dividendState, newValue * divisor)
  },
})

export const resetEquation = transaction<() => void>({
  key: `resetEquation`,
  do: ({ set }) => {
    set(dividendState, 1)
    set(divisorState, 2)
  },
})

export const divisionTimeline = timeline({
  key: `division`,
  atoms: [dividendState, divisorState],
})
