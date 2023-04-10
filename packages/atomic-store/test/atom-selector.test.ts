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
  it(`may depend on more than one atom or selector`, () => {
    const firstNameState = atom<string>({
      key: `firstName`,
      default: `John`,
    })
    const lastNameState = atom<string>({
      key: `lastName`,
      default: `Doe`,
    })
    const fullNameState = selector<string>({
      key: `fullName`,
      get: ({ get }) => `${get(firstNameState)} ${get(lastNameState)}`,
    })
    expect(getState(fullNameState)).toBe(`John Doe`)
    setState(firstNameState, `Jane`)
    expect(getState(fullNameState)).toBe(`Jane Doe`)

    type Gender = `female` | `male` | `other`
    const TITLES: Record<Gender, string> = {
      male: `Mr.`,
      female: `Ms.`,
      other: `Mx.`,
    } as const

    const genderState = atom<Gender>({
      key: `gender`,
      default: `other`,
    })
    const modeOfAddressState = atom<`formal` | `informal`>({
      key: `modeOfAddress`,
      default: `informal`,
    })
    const greetingState = selector<string>({
      key: `greetingState`,
      get: ({ get }) => {
        const modeOfAddress = get(modeOfAddressState)
        if (modeOfAddress === `formal`) {
          return `Dear ${TITLES[get(genderState)]} ${get(lastNameState)},`
        }
        return `Hi ${get(firstNameState)}!`
      },
    })
    expect(getState(greetingState)).toBe(`Hi Jane!`)
    setState(firstNameState, `Janice`)
    expect(getState(greetingState)).toBe(`Hi Janice!`)
    setState(modeOfAddressState, `formal`)
    expect(getState(greetingState)).toBe(`Dear Mx. Doe,`)
    setState(genderState, `female`)
    expect(getState(greetingState)).toBe(`Dear Ms. Doe,`)
  })
})
