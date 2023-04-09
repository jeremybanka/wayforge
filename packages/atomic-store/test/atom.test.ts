import { atom, getState, selector, setAtomState, subscribe } from "../src"

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

    const atomSubscription = subscribe(countAtom, (value) => {
      console.log(`📣 countAtom value changed:`, value)
    })

    const selectorSubscription = subscribe(doubleCountSelector, (value) => {
      console.log(`📣 doubleCountSelector value changed:`, value)
    })

    getState(doubleCountSelector)
    setAtomState(countAtom, 2)

    doubleCountSelector.set(8)
  })
})
