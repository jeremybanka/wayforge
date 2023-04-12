import { vitest } from "vitest"

import type { ContentsOf as In, Parcel } from "~/packages/anvl/src/id"
import { Join } from "~/packages/anvl/src/join"

import * as UTIL from "./-util"
import {
  __INTERNAL__,
  atom,
  atomFamily,
  configure,
  getState,
  selectorFamily,
  setState,
  transaction,
} from "../src"

const loggers = [UTIL.silence, console] as const
const choose = 0
const logger = loggers[choose]

configure({ logger })

beforeEach(() => {
  __INTERNAL__.clearStore()
  vitest.spyOn(logger, `error`)
  vitest.spyOn(logger, `warn`)
  vitest.spyOn(logger, `info`)
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
    const findBeingState = atomFamily<In<Being>, string>({
      key: `Being`,
      default: {
        name: ``,
        species: ``,
        class: ``,
        ...DEFAULT_CORE_STATS,
      },
    })
    const findItemState = atomFamily<In<Item>, string>({
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
      current.set(`Being__"Victim"`, `Item__"Prize"`)
    )
    const thiefInvState = findBeingInventoryState(thiefState.key)
    const victimInvState = findBeingInventoryState(victimState.key)
    expect(getState(thiefInvState)).toEqual([])
    expect(getState(victimInvState)).toEqual([prizeState.key])

    steal(thiefState.key, victimState.key)
    expect(getState(thiefInvState)).toEqual([prizeState.key])
    expect(getState(victimInvState)).toEqual([])
    expect(logger.error).not.toHaveBeenCalled()

    try {
      steal(thiefState.key, victimState.key)
    } catch (thrown) {
      expect(thrown).toBeInstanceOf(Error)
      if (thrown instanceof Error) {
        expect(thrown.message).toEqual(`No items to steal!`)
      }
    }
    expect(logger.error).toHaveBeenCalledTimes(1)

    setState(globalInventoryState, (current) => current.remove(victimState.key))
  })
})
