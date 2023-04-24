import { vitest } from "vitest"

import * as UTIL from "./-util"
import {
  __INTERNAL__,
  atom,
  getState,
  runTransaction,
  selector,
  setLogLevel,
  setState,
  transaction,
  useLogger,
} from "../src"
import { redo, timeline, undo } from "../src/timeline"

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

    const product_abc = selector({
      key: `product of a, b, & c`,
      get: ({ get }) => {
        return get(a) * get(b) * get(c)
      },
    })

    const tl_abc = timeline({
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

    const expectation0 = () => {
      expect(getState(a)).toBe(0)
      expect(getState(b)).toBe(0)
      expect(getState(c)).toBe(0)
      expect(getState(product_abc)).toBe(0)
    }
    expectation0()

    setState(a, 1)
    const expectation1 = () => {
      expect(getState(a)).toBe(1)
      expect(getState(b)).toBe(0)
      expect(getState(c)).toBe(0)
      expect(getState(product_abc)).toBe(0)
    }
    expectation1()

    runTransaction(tx_ab)()
    const expectation2 = () => {
      expect(getState(a)).toBe(2)
      expect(getState(b)).toBe(1)
      expect(getState(c)).toBe(0)
      expect(getState(product_abc)).toBe(0)
    }
    expectation2()

    runTransaction(tx_bc)(2)
    const expectation3 = () => {
      expect(getState(a)).toBe(2)
      expect(getState(b)).toBe(3)
      expect(getState(c)).toBe(2)
    }
    expectation3()

    undo(tl_abc)
    expectation2()

    redo(tl_abc)
    expectation3()

    undo(tl_abc)
    undo(tl_abc)
    expectation1()

    undo(tl_abc)
    expectation0()

    const timelineData = __INTERNAL__.IMPLICIT.STORE.timelineStore.get(
      tl_abc.key
    )
    expect(timelineData.at).toBe(0)
    expect(timelineData.history.length).toBe(3)
  })
})
