import { nanoid } from "nanoid"

import type { Identified } from "~/packages/anvl/src/id"
import { Join } from "~/packages/anvl/src/join"
import type { Json } from "~/packages/anvl/src/json"
import {
  atom,
  atomFamily,
  transaction,
  selectorFamily,
} from "~/packages/atom.io/src"
import { Perspective } from "~/packages/occlusion/src"

import { playersIndex } from "../rooms"

export const findCardValueState = atomFamily<Identified & Json, string>({
  key: `findCardValue`,
  default: () => ({ id: `` }),
})
export const cardValuesIndex = atom<Set<string>>({
  key: `cardValuesIndex`,
  default: new Set<string>(),
})
export const valuesOfCardsState = atom({
  key: `valuesOfCards`,
  default: new Join({
    relationType: `1:n`,
  })
    .from(`valueId`)
    .to(`cardId`),
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
