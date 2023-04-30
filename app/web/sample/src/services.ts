import { useState, useEffect } from "react"

import { atom, selector, setLogLevel, transaction } from "~/packages/atom.io/src"
import { composeStoreHooks } from "~/packages/atom.io/src/react"
import { timeline } from "~/packages/atom.io/src/timeline"

const { useStore, useO, useI, useIO } = composeStoreHooks({
  useState,
  useEffect,
})

export { useStore, useO, useIO, useI }

setLogLevel(`error`)

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
