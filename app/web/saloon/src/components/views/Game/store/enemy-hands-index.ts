import * as AtomIO from "atom.io"

import { playersInRoomsState } from "~/app/node/lodge/src/store/rooms"

import { myRoomState } from "./my-room"
import { socketIdState } from "../../../../services/store"

export const otherPlayersIndex = AtomIO.selector<string[]>({
  key: `otherPlayersIndex`,
  get: ({ get }) => {
    const myId = get(socketIdState)
    if (!myId) {
      return []
    }
    const myRoomId = get(myRoomState)
    if (myRoomId === null) {
      return []
    }
    const playerIdsInMyRoom = get(playersInRoomsState).getRelatedIds(myRoomId)
    const everyoneButMe = [...playerIdsInMyRoom].filter((id) => id !== myId)
    return everyoneButMe
  },
})
