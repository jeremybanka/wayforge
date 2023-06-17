import { atom, atomFamily, selector, transaction } from "atom.io"

import type { Identified } from "~/packages/anvl/src/id"
import { Join } from "~/packages/anvl/src/join"
import type { Json, JsonObj } from "~/packages/anvl/src/json"

export const findCardValueState = atomFamily<Identified & JsonObj, string>({
  key: `findCardValue`,
  default: () => ({ id: `` }),
})
export const cardValuesIndex = atom<Set<string>>({
  key: `cardValuesIndex`,
  default: new Set<string>(),
})
export const cardValuesIndexJSON = selector({
  key: `cardValuesIndexJSON`,
  get: ({ get }) => [...get(cardValuesIndex)],
  set: ({ set }, newValue) => set(cardValuesIndex, new Set(newValue)),
})
export const valuesOfCardsState = atom({
  key: `valuesOfCards`,
  default: new Join({
    relationType: `1:n`,
  })
    .from(`valueId`)
    .to(`cardId`),
})
export const valuesOfCardsStateJSON = selector({
  key: `valuesOfCardsJSON`,
  get: ({ get }) => get(valuesOfCardsState).toJSON(),
  set: ({ set }, newValue) =>
    set(
      valuesOfCardsState,
      Join.fromJSON(newValue, {
        from: `valueId`,
        to: `cardId`,
      })
    ),
})

export const addCardValueTX = transaction<
  <IJ extends Identified & Json>(value: IJ) => boolean
>({
  key: `addCardValue`,
  do: ({ get, set }, value) => {
    const idHasBeenUsed = get(cardValuesIndex).has(value.id)
    if (idHasBeenUsed) {
      console.error(`Card value id has already been used`)
      return false
    }
    set(cardValuesIndex, (current) => new Set([...current, value.id]))
    set(findCardValueState(value.id), value)
    return true
  },
})
