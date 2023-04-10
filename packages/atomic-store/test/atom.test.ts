import { atom, getState, selector, setState, subscribe } from "../src"
import { IMPLICIT } from "../src/store"

describe(`Store`, () => {
  it(`holds selectable state`, () => {
    const countAtom = atom({
      key: `count`,
      default: 0,
    })
    const doubleCountSelector = selector<number>({
      key: `doubleCount`,
      get: ({ get }) => get(countAtom) * 2,
      set: (newValue: number, { set }) => set(countAtom, newValue / 2),
    })
    const doubleCountPlusOneSelector = selector<number>({
      key: `doubleCountPlusOne`,
      get: ({ get }) => get(doubleCountSelector) + 1,
      set: (newValue: number, { set }) => set(doubleCountSelector, newValue - 1),
    })
    const doubleCountPlusOneTimesTwoSelector = selector<number>({
      key: `doubleCountPlusOneTimesTwo`,
      get: ({ get }) => get(doubleCountPlusOneSelector) * 2,
    })

    const atomSubscription = subscribe(countAtom, (value) => {
      console.log(`📣 countAtom value changed:`, value)
    })

    const selectorSubscription = subscribe(doubleCountSelector, (value) => {
      console.log(`📣 doubleCountSelector value changed:`, value)
    })

    const doubleCountPlusOneSelectorSubscription = subscribe(
      doubleCountPlusOneSelector,
      (value) => {
        console.log(`📣 doubleCountPlusOneSelector value changed:`, value)
      }
    )
    console.log(`🧪 1`)
    const count = getState(countAtom)
    console.log({ count })
    const doubleCountPlusOne = getState(doubleCountPlusOneSelector)
    console.log({ doubleCountPlusOne })
    const doubleCount = getState(doubleCountSelector)
    console.log({ doubleCount })
    console.log(`🧪 2`)
    setState(countAtom, 2)

    console.log(`🧪 3`)
    setState(doubleCountPlusOneSelector, 5)
  })
})
