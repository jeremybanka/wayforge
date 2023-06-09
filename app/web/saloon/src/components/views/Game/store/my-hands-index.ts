import * as AtomIO from "atom.io"

import {
  findCardGroupState,
  ownersOfGroupsState,
} from "~/app/node/lodge/src/store/game"

import { socketIdState } from "../../../../services/store"

export const myHandsIndex = AtomIO.selector<string[]>({
  key: `myHands`,
  get: ({ get }) => {
    const myId = get(socketIdState)
    if (!myId) {
      return []
    }
    const ownersOfGroups = get(ownersOfGroupsState)
    const myGroups = ownersOfGroups.getRelatedIds(myId)
    const myHands = myGroups.filter((id) => get(findCardGroupState(id)).type)
    return myHands
  },
})
