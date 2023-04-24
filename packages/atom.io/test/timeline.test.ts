import { vitest } from "vitest"

import * as UTIL from "./-util"
import {
  __INTERNAL__,
  atom,
  runTransaction,
  setLogLevel,
  setState,
  transaction,
  useLogger,
} from "../src"
import { timeline } from "../src/timeline"

const loggers = [UTIL.silence, console] as const
const choose = 1
const logger = loggers[choose]

useLogger(logger)
setLogLevel(`info`)

beforeEach(() => {
  __INTERNAL__.clearStore()
  vitest.spyOn(logger, `error`)
  vitest.spyOn(logger, `warn`)
  vitest.spyOn(logger, `info`)
  vitest.spyOn(UTIL, `stdout`)
})

describe(`timeline`, () => {
  it(`tracks the state of a group of atoms`, () => {
    const a = atom({
      key: `a`,
      default: 0,
    })
    const b = atom({
      key: `b`,
      default: 0,
    })
    const c = atom({
      key: `c`,
      default: 0,
    })
    const tl = timeline({
      key: `a, b, & c`,
      atoms: [a, b, c],
    })

    const tx_ab = transaction<() => void>({
      key: `increment a & b`,
      do: ({ set }) => {
        set(a, (n) => n + 1)
        set(b, (n) => n + 1)
      },
    })

    const tx_bc = transaction<(plus: number) => void>({
      key: `increment b & c`,
      do: ({ set }, add = 1) => {
        set(b, (n) => n + add)
        set(c, (n) => n + add)
      },
    })

    setState(a, 1)
    runTransaction(tx_ab)()
    runTransaction(tx_bc)(2)

    console.log(__INTERNAL__.IMPLICIT.STORE.timelineStore.get(tl.key).history)

    // t.next()
    // t.prev()
    // t.next()
    // t.next()
  })
})
