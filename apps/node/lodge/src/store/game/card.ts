import { atom, atomFamily, selector, selectorFamily } from "atom.io"

import { Join } from "~/packages/anvl/src/join"
import { hasExactProperties } from "~/packages/anvl/src/object"
import { isLiteral, isUnion, isWithin } from "~/packages/anvl/src/refinement"
import { selectJson } from "~/packages/atom.io/src/json"
import { Perspective } from "~/packages/occlusion/src"

export const OWNERS_OF_CARDS = new Join({
  relationType: `1:n`,
})
  .from(`playerId`)
  .to(`cardId`)
export const ownersOfCardsState = atom({
  key: `ownersOfCards`,
  default: OWNERS_OF_CARDS,
})
export const ownersOfCardsStateJSON = selectJson(
  ownersOfCardsState,
  OWNERS_OF_CARDS.makeJsonInterface()
)

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
export const cardIndexJSON = selector<string[]>({
  key: `cardIndexJSON`,
  get: ({ get }) => [...get(cardIndex)],
  set: ({ set }, newValue) => set(cardIndex, new Set(newValue)),
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

export const GROUPS_AND_ZONES_OF_CARD_CYCLES = new Join<{
  type: `group` | `zone`
}>({
  relationType: `1:n`,
})
  .from(`cardCycleId`)
  .to(`groupOrZoneId`)
export const groupsAndZonesOfCardCyclesState = atom({
  key: `groupsAndZonesOfCardCycles`,
  default: GROUPS_AND_ZONES_OF_CARD_CYCLES,
})
export const groupsAndZonesOfCardCyclesStateJSON = selectJson(
  groupsAndZonesOfCardCyclesState,
  GROUPS_AND_ZONES_OF_CARD_CYCLES.makeJsonInterface(
    hasExactProperties({
      type: isWithin([`group`, `zone`] as const),
    })
  )
)
