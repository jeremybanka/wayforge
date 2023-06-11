import { ownersOfGroupsState } from "~/app/node/lodge/src/store/game"
import { selectorFamily } from "~/packages/atom.io/src"

export const findHandsOfPlayer = selectorFamily<string[], string>({
  key: `findHandsOfPlayer`,
  get:
    (playerId) =>
    ({ get }) =>
      get(ownersOfGroupsState).getRelatedIds(playerId),
})
