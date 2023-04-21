/* eslint-disable max-lines */

import { vitest } from "vitest"

import type { ContentsOf as $, Parcel } from "~/packages/anvl/src/id"
import { Join } from "~/packages/anvl/src/join"

import * as UTIL from "./-util"
import {
  __INTERNAL__,
  atom,
  atomFamily,
  getState,
  runTransaction,
  selector,
  selectorFamily,
  setLogLevel,
  setState,
  subscribe,
  transaction,
  useLogger,
} from "../src"

const loggers = [UTIL.silence, console] as const
const choose = 1
const logger = loggers[choose]

useLogger(logger)
setLogLevel(`info`)

beforeEach(() => {
  __INTERNAL__.clearStore()
  /* eslint-disable @typescript-eslint/no-non-null-assertion */
  vitest.spyOn(__INTERNAL__.IMPLICIT.STORE.config.logger!, `error`)
  vitest.spyOn(__INTERNAL__.IMPLICIT.STORE.config.logger!, `warn`)
  vitest.spyOn(__INTERNAL__.IMPLICIT.STORE.config.logger!, `info`)
  vitest.spyOn(UTIL, `stdout`)
})

type CoreStats = {
  fierce: number
  tough: number
  keen: number
  mystic: number
  deft: number
}
const DEFAULT_CORE_STATS: CoreStats = {
  fierce: 0,
  tough: 0,
  keen: 0,
  mystic: 0,
  deft: 0,
}

type Being = Parcel<
  `Being`,
  CoreStats & {
    name: string
    species: string
    class: string
  }
>

type Item = Parcel<
  `Item`,
  CoreStats & {
    name: string
    desc: string
    value: number
  }
>

describe(`transaction`, () => {
  it(`gets and sets state`, () => {
    const findBeingState = atomFamily<$<Being>, string>({
      key: `Being`,
      default: {
        name: ``,
        species: ``,
        class: ``,
        ...DEFAULT_CORE_STATS,
      },
    })
    const findItemState = atomFamily<$<Item>, string>({
      key: `Item`,
      default: {
        name: ``,
        desc: ``,
        value: 0,
        ...DEFAULT_CORE_STATS,
      },
    })
    const globalInventoryState = atom<Join>({
      key: `GlobalInventory`,
      default: new Join({ relationType: `1:n` }),
    })
    const findBeingInventoryState = selectorFamily<string[], string>({
      key: `BeingInventory`,
      get:
        (beingKey) =>
        ({ get }) => {
          const globalInventory = get(globalInventoryState)
          const itemKeys = globalInventory.getRelatedIds(beingKey)
          return itemKeys
        },
    })
    const steal = transaction({
      key: `steal`,
      do: ({ get, set }, thiefKey: string, victimKey: string) => {
        const victimInventory = get(findBeingInventoryState(victimKey))
        const itemKey = victimInventory[0]
        if (itemKey === undefined) throw new Error(`No items to steal!`)
        set(globalInventoryState, (current) => {
          const next = current.set(thiefKey, itemKey)
          return next
        })
      },
    })
    const thiefState = findBeingState(`Thief`)
    setState(thiefState, {
      name: `Tarvis Rink`,
      species: `Ave`,
      class: `Egg-Stealer`,
      ...DEFAULT_CORE_STATS,
      deft: 2,
    })
    const victimState = findBeingState(`Victim`)
    setState(victimState, {
      name: `Roader`,
      species: `Cat`,
      class: `Brigand`,
      ...DEFAULT_CORE_STATS,
      tough: 1,
    })
    const prizeState = findItemState(`Prize`)
    setState(findItemState(`Prize`), {
      name: `Chocolate Coin`,
      desc: `A chocolate coin with a hole in the middle.`,
      value: 1,
      ...DEFAULT_CORE_STATS,
      keen: 1,
    })
    setState(globalInventoryState, (current) =>
      current.set(victimState.key, prizeState.key)
    )
    const thiefInvState = findBeingInventoryState(thiefState.key)
    const victimInvState = findBeingInventoryState(victimState.key)
    expect(getState(thiefInvState)).toEqual([])
    expect(getState(victimInvState)).toEqual([prizeState.key])

    runTransaction(steal)(thiefState.key, victimState.key)
    expect(getState(thiefInvState)).toEqual([prizeState.key])
    expect(getState(victimInvState)).toEqual([])
    expect(
      __INTERNAL__.IMPLICIT.STORE.config.logger!.error
    ).not.toHaveBeenCalled()

    try {
      runTransaction(steal)(thiefState.key, victimState.key)
    } catch (thrown) {
      expect(thrown).toBeInstanceOf(Error)
      if (thrown instanceof Error) {
        expect(thrown.message).toEqual(`No items to steal!`)
      }
    }
    expect(
      __INTERNAL__.IMPLICIT.STORE.config.logger!.error
    ).toHaveBeenCalledTimes(1)

    setState(globalInventoryState, (current) => current.remove(victimState.key))
  })
})

describe(`transaction implementation specifics`, () => {
  it(`does not emit updates until the end of the transaction`, () => {
    const NOUNS = [`cat`, `child`, `antenna`] as const
    type Noun = (typeof NOUNS)[number]
    const PLURALS = {
      cat: `cats`,
      child: `children`,
      antenna: `antennae`,
    }
    type Plural = (typeof PLURALS)[Noun]
    const countState = atom<number>({
      key: `count`,
      default: 2,
    })
    const nounState = atom<Noun>({
      key: `noun`,
      default: `cat`,
    })
    const pluralState = selector<Plural>({
      key: `plural`,
      get: ({ get }) => {
        const noun = get(nounState)
        return PLURALS[noun]
      },
      set: ({ set }, newValue) => {
        const noun = Object.keys(PLURALS).find(
          (noun) => PLURALS[noun as Noun] === newValue
        ) as Noun
        set(nounState, noun)
      },
    })
    const expressionState = selector<Noun | Plural>({
      key: `expression`,
      get: ({ get }) => {
        const count = get(countState)
        const nounPhrase = count === 1 ? get(nounState) : get(pluralState)
        return get(countState) + ` ` + nounPhrase
      },
    })

    const modifyExpression = transaction({
      key: `modifyExpression`,
      do: ({ set }, newExpression: Noun | Plural) => {
        const newCount = Number(newExpression.split(` `)[0])
        if (isNaN(newCount)) {
          throw new Error(`Invalid expression: ${newExpression} is not a number`)
        }
        set(countState, newCount)
        const newNoun = newExpression.split(` `)[1] as Noun
        if (
          !NOUNS.includes(newNoun) &&
          !Object.values(PLURALS).includes(newNoun)
        ) {
          throw new Error(
            `Invalid expression: ${newNoun} is not a recognized noun`
          )
        }
        set(pluralState, newExpression.split(` `)[1])
        return true
      },
    })

    expect(getState(expressionState)).toEqual(`2 cats`)
    vitest.spyOn(UTIL, `stdout`)
    subscribe(expressionState, UTIL.stdout)

    runTransaction(modifyExpression)(`3 children`)
    // 2 atoms were set, therefore 2 updates were made to the selector
    // this is a "playback" strategy, where the entire transaction is
    // captured, one atom at a time. An all-at-once strategy can be
    // more performant in some cases, so it may be added in the future.
    expect(UTIL.stdout).toHaveBeenCalledTimes(2)
    expect(getState(countState)).toEqual(3)
    expect(getState(pluralState)).toEqual(`children`)
    expect(getState(nounState)).toEqual(`child`)

    // but what if the transaction fails?
    let caught: unknown
    try {
      runTransaction(modifyExpression)(`3 ants`)
    } catch (thrown) {
      caught = thrown
    }
    expect(caught).toBeInstanceOf(Error)
    if (caught instanceof Error) {
      expect(caught.message).toEqual(
        `Invalid expression: ants is not a recognized noun`
      )
    }
    // the transaction failed, so no updates were made
    expect(UTIL.stdout).toHaveBeenCalledTimes(2)
    expect(getState(countState)).toEqual(3)
    expect(getState(pluralState)).toEqual(`children`)
    expect(getState(nounState)).toEqual(`child`)
  })
  it.skip(`does not emit updates until the end of the transaction`, () => {
    const countState = atom<number>({
      key: `count`,
      default: 2,
    })
    const doubleState = selector<number>({
      key: `double`,
      get: ({ get }) => get(countState) * 2,
      set: ({ set }, newValue) => set(countState, newValue / 2),
    })
    const doublePlusOneState = selector<number>({
      key: `doublePlusOne`,
      get: ({ get }) => get(doubleState) + 1,
      set: ({ set }, newValue) => set(doubleState, newValue - 1),
    })
    const tripleState = selector<number>({
      key: `triple`,
      get: ({ get }) => get(countState) * 3,
      set: ({ set }, newValue) => set(countState, newValue / 3),
    })
    const triplePlusOneState = selector<number>({
      key: `triplePlusOne`,
      get: ({ get }) => get(tripleState) + 1,
      set: ({ set }, newValue) => set(tripleState, newValue - 1),
    })
    const doublePlusOnePlusTriplePlusOneState = selector<number>({
      key: `doublePlusOnePlusTriplePlusOne`,
      get: ({ get }) => get(doublePlusOneState) + get(triplePlusOneState),
      set: ({ set }, newValue) => {
        const newValueMinusTwo = newValue - 2
        const count = newValueMinusTwo / 5
        set(doublePlusOneState, count * 2 + 1)
        set(triplePlusOneState, count * 3 + 1)
      },
    })

    vitest.spyOn(UTIL, `stdout`)
  })
})
