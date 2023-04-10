import { vitest } from "vitest"

import { atom, getState, selector, setState, subscribe } from "../src"
import * as INTERNALS from "../src/internal"

export const silence: Pick<Console, `error` | `info` | `warn`> = {
  error: () => null,
  warn: () => null,
  info: () => null,
}
const loggers = [silence, console] as const
const choose = 1
const logger = loggers[choose]

INTERNALS.configureStore({ logger })

beforeEach(() => {
  INTERNALS.clearStore()
  vitest.spyOn(logger, `error`)
  vitest.spyOn(logger, `warn`)
  vitest.spyOn(logger, `info`)
})

describe(`atom`, () => {
  it(`can be modified and retrieved`, () => {
    const count = atom<number>({
      key: `count`,
      default: 0,
    })
    setState(count, 1)
    expect(getState(count)).toBe(1)
    setState(count, 2)
    expect(getState(count)).toBe(2)
  })
  it(`can be subscribed to`, () => {
    const name = atom<string>({
      key: `name`,
      default: `John`,
    })
    subscribe(name, logger.info)
    setState(name, `Jane`)
    expect(logger.info).toHaveBeenCalledWith(`Jane`)
  })
})

describe(`selector`, () => {
  it(`can be modified and retrieved`, () => {
    const count = atom<number>({
      key: `count`,
      default: 0,
    })
    const double = selector<number>({
      key: `double`,
      get: ({ get }) => get(count) * 2,
    })
    setState(count, 1)
    expect(getState(double)).toBe(2)
    setState(count, 2)
    expect(getState(double)).toBe(4)
  })
  it(`can be subscribed to`, () => {
    const count = atom<number>({
      key: `count`,
      default: 0,
    })
    const double = selector<number>({
      key: `double`,
      get: ({ get }) => get(count) * 2,
    })
    subscribe(double, logger.info)
    setState(count, 1)
    expect(logger.info).toHaveBeenCalledWith(2)
  })
  it(`can be set, propagating changes to all related atoms`, () => {
    const count = atom<number>({
      key: `count`,
      default: 0,
    })
    const double = selector<number>({
      key: `double`,
      get: ({ get }) => get(count) * 2,
      set: ({ set }, newValue) => set(count, newValue / 2),
    })
    const triple = selector<number>({
      key: `triple`,
      get: ({ get }) => get(count) * 3,
    })
    const doublePlusOne = selector<number>({
      key: `doublePlusOne`,
      get: ({ get }) => get(double) + 1,
    })
    setState(double, 20)
    expect(getState(count)).toBe(10)
    expect(getState(double)).toBe(20)
    expect(getState(triple)).toBe(30)
    expect(getState(doublePlusOne)).toBe(21)
  })
})
