import { option } from "fp-ts/lib/Option"
import { nanoid } from "nanoid"

import type { Identified, Parcel } from "~/packages/anvl/src/id"
import { Join } from "~/packages/anvl/src/join"
import type { Json } from "~/packages/anvl/src/json"
import type { RequireAtLeastOne } from "~/packages/anvl/src/object"
import {
  atom,
  atomFamily,
  transaction,
  selectorFamily,
} from "~/packages/atom.io/src"
import { Perspective } from "~/packages/occlusion/src"

import { playersIndex } from "./rooms"

export const ownersOfCardsState = atom({
  key: `ownersOfCards`,
  default: new Join({
    relationType: `1:n`,
  })
    .from(`playerId`)
    .to(`cardId`),
})
export const findOwnerOfCardState = selectorFamily<string | null, string>({
  key: `findOwnerOfCard`,
  get:
    (cardId) =>
    ({ get }) => {
      const owner = get(ownersOfCardsState).getRelatedId(cardId)
      return owner ?? null
    },
})

export const findPlayerPerspectiveState = atomFamily<Perspective, `string`>({
  key: `findPlayerPerspective`,
  default: new Perspective(),
})

export type Card = {
  rotation: number
}
export const findCardState = atomFamily<Card, `string`>({
  key: `findCard`,
  default: () => ({
    rotation: 0,
  }),
})
export const cardIndex = atom<Set<string>>({
  key: `cardIndex`,
  default: new Set<string>(),
})

export type CardGroup = {
  name: string
  rotation: number
}
export const findCardGroupState = atomFamily<CardGroup, `string`>({
  key: `findCardGroup`,
  default: () => ({
    name: ``,
    rotation: 0,
  }),
})
export const cardGroupIndex = atom<Set<string>>({
  key: `cardGroupsIndex`,
  default: new Set<string>(),
})
export const groupsOfCardsState = atom({
  key: `groupsOfCards`,
  default: new Join({
    relationType: `1:n`,
  })
    .from(`groupId`)
    .to(`cardId`),
})
export const ownersOfGroupsState = atom({
  key: `ownersOfGroups`,
  default: new Join({
    relationType: `1:n`,
  })
    .from(`playerId`)
    .to(`groupId`),
})

export type CardCycle = {
  name: string
}
export const findCardCycleState = atomFamily<CardCycle, `string`>({
  key: `findCardCycle`,
  default: () => ({
    name: ``,
  }),
})
export const groupsAndZonesOfCardCyclesState = atom({
  key: `groupsAndZonesOfCardCycles`,
  default: new Join<{ type: `group` | `zone` }>({
    relationType: `1:n`,
  })
    .from(`cardCycleId`)
    .to(`groupOrZoneId`),
})

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

export const addCardValue = transaction<
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

export const spawnCard = transaction<
  (options: {
    valueId: string
    target: { groupId: string } | { playerId: string } | { zoneId: string }
  }) => void
>({
  key: `spawnCard`,
  do: ({ get, set }, { valueId, target }) => {
    const cardId = nanoid()
    if (`groupId` in target) {
      const { groupId } = target
      const cardGroupDoesExist = get(cardGroupIndex).has(groupId)
      if (!cardGroupDoesExist) {
        throw new Error(`Card group does not exist`)
      }
      set(groupsOfCardsState, (current) => current.set({ groupId, cardId }))
      set(cardIndex, (current) => new Set([...current, cardId]))
    } else if (`playerId` in target) {
      const { playerId } = target
      const playerDoesExist = get(playersIndex).has(playerId)
      if (!playerDoesExist) {
        throw new Error(`Player does not exist`)
      }
      console.log({ playerId, cardId }, `not implemented`)
    } else if (`zoneId` in target) {
      console.log({ target }, `not implemented`)
    } else {
      throw new Error(`Invalid target`)
    }
    set(valuesOfCardsState, (current) => current.set({ cardId, valueId }))
  },
})

export const spawnCardGroup = transaction<() => void>({
  key: `spawnCardGroup`,
  do: () => {
    return undefined
  },
})

// 1. internal - only the server can see it
// 2. public - everyone can get or subscribe to it
// 3. free-for-all - everyone can set it ()
// 4. private - only the owner can set it, get it, or sub to it
// 5. protected - only the owner can set it, but everyone can sub to it
