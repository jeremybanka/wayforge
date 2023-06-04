import { Join } from "~/packages/anvl/src/join"
import { atom, atomFamily } from "~/packages/atom.io/src"

export type CardGroup = {
  type: `deck` | `hand` | `pile`
  name: string
  rotation: number
}
export const findCardGroupState = atomFamily<CardGroup, string>({
  key: `findCardGroup`,
  default: () => ({
    type: `deck`,
    name: ``,
    rotation: 0,
  }),
})
export const cardGroupIndex = atom<Set<string>>({
  key: `cardGroupsIndex`,
  default: new Set<string>(),
})
export const cardGroupsOfGamesState = atom({
  key: `cardGroupsOfGames`,
  default: new Join({
    relationType: `1:n`,
  })
    .from(`gameId`)
    .to(`cardGroupId`),
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
