import { atom, atomFamily, selectorFamily, transaction } from "atom.io"
import { nanoid } from "nanoid"

import { Join } from "~/packages/anvl/src/join"

export const roomsIndex = atom<Set<string>>({
  key: `roomsIndex`,
  default: new Set<string>(),
})
export type Room = {
  id: string
  name: string
}
export const findRoomState = atomFamily<Room, string>({
  key: `findRoom`,
  default: { id: ``, name: `` },
})

export const playersIndex = atom<Set<string>>({
  key: `playersIndex`,
  default: new Set<string>(),
})

export type Player = {
  id: string
  name: string
}

export const findPlayerState = atomFamily<Player, string>({
  key: `findPlayer`,
  default: {
    id: ``,
    name: ``,
  },
})

export const playersInRoomsState = atom<
  Join<{ enteredAt: number }, `roomId`, `playerId`>
>({
  key: `playersInRooms`,
  default: new Join<{ enteredAt: number }>({
    relationType: `1:n`,
  })
    .from(`roomId`)
    .to(`playerId`),
})

export const findPlayersInRoomState = selectorFamily<
  { id: string; enteredAt: number }[],
  string
>({
  key: `findPlayersInRoom`,
  get:
    (roomId) =>
    ({ get }) =>
      get(playersInRoomsState).getRelations(roomId),
  set:
    (roomId) =>
    ({ set }, newValue) =>
      set(playersInRoomsState, (current) =>
        current.setRelations({ roomId }, newValue)
      ),
})

export const createRoom = transaction<(id?: string) => string>({
  key: `createRoom`,
  do: ({ set }, roomId = nanoid()) => {
    set(roomsIndex, (ids) => new Set([...ids, roomId].sort()))
    return roomId
  },
})

export const joinRoom = transaction<(roomId: string, playerId: string) => void>({
  key: `joinRoom`,
  do: ({ set }, roomId, playerId) => {
    set(playersInRoomsState, (current) =>
      current.set(
        { roomId, playerId },
        {
          enteredAt: Date.now(),
        }
      )
    )
  },
})
