import { useState, useEffect } from "react"

import { atom, selector, setLogLevel, transaction } from "~/packages/atom.io/src"
import { composeStoreHooks } from "~/packages/atom.io/src/react"
import { composeDevtools } from "~/packages/atom.io/src/react/Devtools/AtomIODevtools"
import { composeExplorer } from "~/packages/atom.io/src/react/Explorer/Explorer"
import { timeline } from "~/packages/atom.io/src/timeline"

const storeHooks = composeStoreHooks({ useState, useEffect })

export const { Devtools } = composeDevtools({ storeHooks })
export const { Explorer, useSetTitle } = composeExplorer({ storeHooks })

export const { useStore, useO, useIO, useI } = storeHooks

setLogLevel(`info`)

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
