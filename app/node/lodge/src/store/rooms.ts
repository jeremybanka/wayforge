import type { TransactionIO } from "atom.io"
import { atom, atomFamily, selector, selectorFamily, transaction } from "atom.io"
import { nanoid } from "nanoid"

import { Join } from "~/packages/anvl/src/join"
import type { RelationData } from "~/packages/anvl/src/join/core-relation-data"

export const roomsIndex = atom<Set<string>>({
  key: `roomsIndex`,
  default: new Set<string>(),
})
export const roomsIndexJSON = selector<string[]>({
  key: `roomsIndexJSON`,
  get: ({ get }) => [...get(roomsIndex)],
  set: ({ set }, newValue) => set(roomsIndex, new Set(newValue)),
})
export type Room = {
  id: string
  name: string
}
export const findRoomState = atomFamily<Room, string>({
  key: `findRoom`,
  default: { id: ``, name: `` },
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
export const playersIndex = atom<Set<string>>({
  key: `playersIndex`,
  default: new Set<string>(),
})
export const playersIndexJSON = selector<string[]>({
  key: `playersIndexJSON `,
  get: ({ get }) => [...get(playersIndex)],
  set: ({ set }, newValue) => set(playersIndex, new Set(newValue)),
})

export const playersInRoomsState = atom<
  Join<{ enteredAt: number }, `roomId`, `playerId`>
>({
  key: `playersInRoomsIndex`,
  default: new Join<{ enteredAt: number }>({
    relationType: `1:n`,
  })
    .from(`roomId`)
    .to(`playerId`),
})
export const playersInRoomsStateJSON = selector<
  RelationData<{ enteredAt: number }, `roomId`, `playerId`>
>({
  key: `playersInRoomsJSON`,
  get: ({ get }) => get(playersInRoomsState).toJSON(),
  set: ({ set }, newValue) => set(playersInRoomsState, new Join(newValue)),
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

export const createRoomTX = transaction<(id?: string) => string>({
  key: `createRoom`,
  do: ({ set }, roomId = nanoid()) => {
    set(roomsIndex, (ids) => new Set([...ids, roomId].sort()))
    return roomId
  },
})
export type CreateRoomIO = TransactionIO<typeof createRoomTX>

export const joinRoomTX = transaction<
  (options: { roomId: string; playerId: string }) => void
>({
  key: `joinRoom`,
  do: ({ set }, { roomId, playerId }) => {
    set(playersInRoomsState, (current) =>
      current.set({ roomId, playerId }, { enteredAt: Date.now() })
    )
  },
})
export type JoinRoomIO = TransactionIO<typeof joinRoomTX>

export const leaveRoomTX = transaction<
  (options: { roomId: string; playerId: string }) => void
>({
  key: `leaveRoom`,
  do: ({ set }, { roomId, playerId }) => {
    set(playersInRoomsState, (current) => current.remove({ roomId, playerId }))
  },
})
export type LeaveRoomIO = TransactionIO<typeof leaveRoomTX>
