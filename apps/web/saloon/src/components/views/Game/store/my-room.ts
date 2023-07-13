import * as AtomIO from "atom.io"
import { myIdState } from "atom.io/realtime-react"

import { playersInRoomsState } from "~/apps/node/lodge/src/store/rooms"

export const myRoomState = AtomIO.selector<string | null>({
  key: `myRoom`,
  get: ({ get }) => {
    const myId = get(myIdState)
    return myId ? get(playersInRoomsState).getRelatedId(myId) ?? null : null
  },
})
