import { Join } from "~/packages/anvl/src/join"
import { atom, atomFamily, selector } from "~/packages/atom.io/src"

export type CardGroup = {
  type: `deck` | `hand` | `pile` | null
  name: string
  rotation: number
}
export const findCardGroupState = atomFamily<CardGroup, string>({
  key: `findCardGroup`,
  default: () => ({
    type: null,
    name: ``,
    rotation: 0,
  }),
})
export const cardGroupIndex = atom<Set<string>>({
  key: `cardGroupsIndex`,
  default: new Set<string>(),
})
export const cardGroupIndexJSON = selector<string[]>({
  key: `cardGroupsIndexJSON`,
  get: ({ get }) => [...get(cardGroupIndex)],
  set: ({ set }, newValue) => set(cardGroupIndex, new Set(newValue)),
})
export const cardGroupsOfGamesState = atom({
  key: `cardGroupsOfGames`,
  default: new Join({
    relationType: `1:n`,
  })
    .from(`gameId`)
    .to(`cardGroupId`),
})
export const cardGroupsOfGamesStateJSON = selector({
  key: `cardGroupsOfGamesJSON`,
  get: ({ get }) => get(cardGroupsOfGamesState).toJSON(),
  set: ({ set }, newValue) =>
    set(cardGroupsOfGamesState, Join.fromJSON(newValue)),
})

export const groupsOfCardsState = atom({
  key: `groupsOfCards`,
  default: new Join({
    relationType: `1:n`,
  })
    .from(`groupId`)
    .to(`cardId`),
})
export const groupsOfCardsStateJSON = selector({
  key: `groupsOfCardsJSON`,
  get: ({ get }) => get(groupsOfCardsState).toJSON(),
  set: ({ set }, newValue) => set(groupsOfCardsState, Join.fromJSON(newValue)),
})

export const ownersOfGroupsState = atom({
  key: `ownersOfGroups`,
  default: new Join({
    relationType: `1:n`,
  })
    .from(`playerId`)
    .to(`groupId`),
})
export const ownersOfGroupsStateJSON = selector({
  key: `ownersOfGroupsJSON`,
  get: ({ get }) => get(ownersOfGroupsState).toJSON(),
  set: ({ set }, newValue) => set(ownersOfGroupsState, Join.fromJSON(newValue)),
})
