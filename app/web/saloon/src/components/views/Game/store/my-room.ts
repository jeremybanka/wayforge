import * as AtomIO from "atom.io"

import { playersInRoomsState } from "~/app/node/lodge/src/store/rooms"

import { socketIdState } from "../../../../services/store"

export const myRoomState = AtomIO.selector<string | null>({
  key: `myRoom`,
  get: ({ get }) => {
    const socketId = get(socketIdState)
    return socketId
      ? get(playersInRoomsState).getRelatedId(socketId) ?? null
      : null
  },
})
