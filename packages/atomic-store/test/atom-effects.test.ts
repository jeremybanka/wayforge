import { vitest } from "vitest"

import * as UTIL from "./test-utils"
import { atomFamily, getState, setState } from "../src"
import * as INTERNALS from "../src/internal"

const loggers = [UTIL.silence, console] as const
const choose = 0
const logger = loggers[choose]

INTERNALS.configureStore({ logger })

beforeEach(() => {
  INTERNALS.clearStore()
  vitest.spyOn(logger, `error`)
  vitest.spyOn(logger, `warn`)
  vitest.spyOn(logger, `info`)
  vitest.spyOn(UTIL, `stdout`)
})

describe(`atom effects`, () => {
  it(`runs a function onSet`, () => {
    const findCoordinateState = atomFamily<{ x: number; y: number }, string>({
      key: `coordinate`,
      default: { x: 0, y: 0 },
      effects: (key) => [
        ({ onSet }) => {
          onSet((newValue) => {
            UTIL.stdout(`onSet`, key, newValue)
          })
        },
      ],
    })
    setState(findCoordinateState(`a`), { x: 1, y: 1 })
    expect(UTIL.stdout).toHaveBeenCalledWith(`onSet`, `a`, {
      newValue: { x: 1, y: 1 },
      oldValue: { x: 0, y: 0 },
    })
  })
})
