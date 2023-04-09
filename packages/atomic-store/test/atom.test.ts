import {
  atom,
  getState,
  selector,
  setAtomState,
  setState,
  subscribe,
} from "../src"

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
    setState(doubleCountSelector, 8)
  })
})
