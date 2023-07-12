import { vitest } from "vitest"

import * as UTIL from "./__util__"
import {
  __INTERNAL__,
  atom,
  getState,
  runTransaction,
  selector,
  setLogLevel,
  setState,
  subscribe,
  subscribeToTimeline,
  transaction,
} from "../src"
import { redo, timeline, undo } from "../src/timeline"

const LOG_LEVELS = [null, `error`, `warn`, `info`] as const
const CHOOSE = 0
setLogLevel(LOG_LEVELS[CHOOSE])
const logger = __INTERNAL__.IMPLICIT.STORE.config.logger ?? console

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
      default: 5,
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

    subscribeToTimeline(tl_abc, (update) => console.error(update))

    const expectation0 = () => {
      expect(getState(a)).toBe(5)
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

    const timelineData = __INTERNAL__.IMPLICIT.STORE.timelines.get(tl_abc.key)
    expect(timelineData.at).toBe(0)
    expect(timelineData.history.length).toBe(3)
  })
  test(`subscriptions when time-traveling`, () => {
    const a = atom({
      key: `a`,
      default: 3,
    })
    const b = atom({
      key: `b`,
      default: 6,
    })

    const product_ab = selector({
      key: `product of a & b`,
      get: ({ get }) => {
        return get(a) * get(b)
      },
      set: ({ set }, value) => {
        set(a, Math.sqrt(value))
        set(b, Math.sqrt(value))
      },
    })

    const timeline_ab = timeline({
      key: `a & b`,
      atoms: [a, b],
    })

    subscribe(a, UTIL.stdout)

    setState(product_ab, 1)
    undo(timeline_ab)

    expect(getState(a)).toBe(3)

    expect(UTIL.stdout).toHaveBeenCalledWith({ oldValue: 3, newValue: 1 })
    expect(UTIL.stdout).toHaveBeenCalledWith({ oldValue: 1, newValue: 3 })
  })
  test(`history erasure from the past`, () => {
    const nameState = atom<string>({
      key: `name`,
      default: `josie`,
    })
    const nameCapitalizedState = selector<string>({
      key: `name_capitalized`,
      get: ({ get }) => {
        return get(nameState).toUpperCase()
      },
      set: ({ set }, value) => {
        set(nameState, value.toLowerCase())
      },
    })
    const setName = transaction<(s: string) => void>({
      key: `set name`,
      do: ({ set }, name) => {
        set(nameCapitalizedState, name)
      },
    })

    const nameHistory = timeline({
      key: `name history`,
      atoms: [nameState],
    })

    expect(getState(nameState)).toBe(`josie`)

    setState(nameState, `vance`)
    setState(nameCapitalizedState, `JON`)
    runTransaction(setName)(`Sylvia`)

    const timelineData = __INTERNAL__.IMPLICIT.STORE.timelines.get(
      nameHistory.key
    )

    expect(getState(nameState)).toBe(`sylvia`)
    expect(timelineData.at).toBe(3)
    expect(timelineData.history.length).toBe(3)

    undo(nameHistory)
    expect(getState(nameState)).toBe(`jon`)
    expect(timelineData.at).toBe(2)
    expect(timelineData.history.length).toBe(3)

    undo(nameHistory)
    expect(getState(nameState)).toBe(`vance`)
    expect(timelineData.at).toBe(1)
    expect(timelineData.history.length).toBe(3)

    undo(nameHistory)
    expect(getState(nameState)).toBe(`josie`)
    expect(timelineData.at).toBe(0)
    expect(timelineData.history.length).toBe(3)

    runTransaction(setName)(`Mr. Jason Gold`)

    expect(getState(nameState)).toBe(`mr. jason gold`)
    expect(timelineData.at).toBe(1)
    expect(timelineData.history.length).toBe(1)
  })
})
