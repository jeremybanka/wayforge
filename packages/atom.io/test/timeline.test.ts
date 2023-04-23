import { vitest } from "vitest"

import * as UTIL from "./-util"
import { __INTERNAL__, atom, setLogLevel, setState, useLogger } from "../src"
import { Timeline, timeline } from "../src/timeline"

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
    const t = timeline({
      key: `my timeline`,
      atoms: [a, b, c],
    })
    setState(a, 1)

    // t.next()
    // t.prev()
    // t.next()
    // t.next()
  })
})
