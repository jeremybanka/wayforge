import { vitest } from "vitest"

import * as UTIL from "./-util"
import type { AtomToken, TimelineToken } from "../src"
import {
  redo,
  undo,
  __INTERNAL__,
  atom,
  useLogger,
  selector,
  setState,
  timeline,
  atomFamily,
} from "../src"
import { setLogLevel } from "../src/internal"

useLogger(console)
setLogLevel(`info`)

const logger = __INTERNAL__.IMPLICIT.STORE.config.logger ?? console

beforeEach(() => {
  __INTERNAL__.clearStore()
  vitest.spyOn(logger, `error`)
  vitest.spyOn(logger, `warn`)
  vitest.spyOn(logger, `info`)
  vitest.spyOn(UTIL, `stdout`)
})

describe(`graceful handling of improper usage`, () => {
  describe(`a nested call to setState is a violation`, () => {
    test(`the inner call results in a no-op and a logger(error)`, () => {
      const a = atom({
        key: `a`,
        default: 0,
      })
      const b = atom({
        key: `b`,
        default: false,
      })
      const c = atom({
        key: `c`,
        default: `hi`,
      })
      const s = selector({
        key: `s`,
        get: ({ get }) => {
          return get(b) ? get(a) + 1 : 0
        },
        set: ({ set }, n) => {
          set(a, n)
          set(b, true)
          set(c, `bye`)
        },
      })
      const tl_ab = timeline({
        key: `a & b`,
        atoms: [a, b],
      })
      setState(a, (n) => {
        setState(b, true)
        return n + 1
      })
      setState(s, 2)
      setState(s, 3)
      const timelineData = __INTERNAL__.IMPLICIT.STORE.timelineStore.get(`a & b`)

      expect(logger.error).toHaveBeenCalledWith(
        `❌ failed to setState to "b" during a setState for "a"`
      )
      expect(timelineData.history).toHaveLength(2)
      expect(timelineData.history[0]).toEqual({
        type: `atom_update`,
        key: `a`,
        oldValue: 0,
        newValue: 1,
      })
      expect(timelineData.history[1]).toEqual({
        type: `selector_update`,
        key: `s`,
        atomUpdates: [
          { type: `atom_update`, key: `a`, oldValue: 1, newValue: 2 },
          { type: `atom_update`, key: `b`, oldValue: false, newValue: true },
        ],
      })
    })
  })
})

describe(`recipes`, () => {
  describe(`timeline family recipe`, () => {
    it(`creates a timeline for each atom in the family`, () => {
      const f = atomFamily({
        key: `f`,
        default: 0,
      })
      const ftl = (
        key: string
      ): [state: AtomToken<number>, timeline: TimelineToken] => {
        const stateToken = f(key)
        const timelineToken = timeline({
          key: `timeline for ${stateToken.key}`,
          atoms: [stateToken],
        })
        return [stateToken, timelineToken]
      }
      const [a, atl] = ftl(`a`)

      setState(a, 1)
      undo(atl)
      undo(atl)
      redo(atl)
      redo(atl)
    })
  })
})
