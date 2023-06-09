import type { FC } from "react"

import { useO } from "atom.io/react"
import { Link } from "wouter"

import {
  findPlayersInRoomState,
  joinRoomTX,
  leaveRoomTX,
} from "~/app/node/lodge/src/store/rooms"

import {
  socketIdState,
  useRemoteTransaction,
  useRemoteFamilyMember,
} from "../../../services/store"
import { Game } from "../Game/Game"

export const Room: FC<{ roomId: string }> = ({ roomId }) => {
  const socketId = useO(socketIdState)
  const playersInRoom = useO(findPlayersInRoomState(roomId))
  const iAmInRoom = playersInRoom.some((player) => player.id === socketId)

  const joinRoom = useRemoteTransaction(joinRoomTX)
  const leaveRoom = useRemoteTransaction(leaveRoomTX)
  useRemoteFamilyMember(findPlayersInRoomState, roomId, {
    fromJson: (json) => json,
    toJson: (value) => value,
  })

  return (
    <article className="room">
      <h2>Room # {roomId}</h2>
      <Link href="/">Back to Lobby</Link>
      <div>
        {playersInRoom.map((player) => (
          <div key={player.id}>
            {player.id}: {player.enteredAt}
          </div>
        ))}
      </div>

      <button
        onClick={() => joinRoom({ roomId, playerId: socketId ?? `` })}
        disabled={iAmInRoom}
      >
        Join Room
      </button>
      <button
        onClick={() => leaveRoom({ roomId, playerId: socketId ?? `` })}
        disabled={!iAmInRoom}
      >
        Leave Room
      </button>
      {iAmInRoom ? <Game /> : null}
    </article>
  )
}
