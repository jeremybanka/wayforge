import { Join } from "~/packages/anvl/src/join"
import { atom, atomFamily, selectorFamily } from "~/packages/atom.io/src"
import { Perspective } from "~/packages/occlusion/src"

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

export const findPlayerPerspectiveState = atomFamily<Perspective, string>({
  key: `findPlayerPerspective`,
  default: new Perspective(),
})

export type Card = {
  rotation: number
}
export const findCardState = atomFamily<Card, string>({
  key: `findCard`,
  default: () => ({
    rotation: 0,
  }),
})
export const cardIndex = atom<Set<string>>({
  key: `cardIndex`,
  default: new Set<string>(),
})

export type CardCycle = {
  name: string
}
export const findCardCycleState = atomFamily<CardCycle, string>({
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
