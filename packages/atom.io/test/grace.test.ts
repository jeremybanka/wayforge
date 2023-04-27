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
      expect(timelineData.history).toHaveLength(3)
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
      expect(timelineData.history[2]).toEqual({
        type: `selector_update`,
        key: `s`,
        atomUpdates: [
          { type: `atom_update`, key: `a`, oldValue: 2, newValue: 3 },
          { type: `atom_update`, key: `b`, oldValue: true, newValue: true },
        ],
      })
    })
  })
  describe(`giving an atom to multiple timelines is a violation`, () => {
    test(`the second timeline does not track the atom, and a logger(error) is given`, () => {
      const a = atom({
        key: `a`,
        default: 0,
      })
      const tl_a = timeline({
        key: `ta`,
        atoms: [a],
      })
      const tl_b = timeline({
        key: `tb`,
        atoms: [a],
      })
      setState(a, 1)
      const timelineData_a = __INTERNAL__.IMPLICIT.STORE.timelineStore.get(`ta`)
      const timelineData_b = __INTERNAL__.IMPLICIT.STORE.timelineStore.get(`tb`)

      expect(logger.error).toHaveBeenCalledWith(
        `❌ Failed to add atom "a" to timeline "tb" because it belongs to timeline "ta"`
      )
      expect(timelineData_a.history).toHaveLength(1)
      expect(timelineData_b.history).toHaveLength(0)
    })
    test(`if a family is tracked by a timeline, a member of that family cannot be tracked by another timeline`, () => {
      const f = atomFamily({
        key: `f`,
        default: 0,
      })
      const tl_f = timeline({
        key: `tf`,
        atoms: [f],
      })
      const a = f(`a`)
      const tl_a = timeline({
        key: `ta`,
        atoms: [a],
      })
      setState(a, 1)

      const timelineData_f = __INTERNAL__.IMPLICIT.STORE.timelineStore.get(`tf`)
      const timelineData_a = __INTERNAL__.IMPLICIT.STORE.timelineStore.get(`ta`)
      expect(logger.error).toHaveBeenCalledWith(
        `❌ Failed to add atom "f("a")" to timeline "ta" because its family "f" belongs to timeline "tf"`
      )
      expect(timelineData_f.history).toHaveLength(1)
      expect(timelineData_a.history).toHaveLength(0)
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
