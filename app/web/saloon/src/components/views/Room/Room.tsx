import type { FC } from "react"

import { css } from "@emotion/react"
import { useO } from "atom.io/react"
import { useParams, Link } from "react-router-dom"

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
import { H3 } from "../../containers/H3"
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
      <Link to="/">Back to Lobby</Link>
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

export const RoomRoute: FC = () => {
  const { roomId } = useParams<{ roomId: string }>()
  return roomId ? <Room roomId={roomId} /> : <H3.Wedge>Room not found</H3.Wedge>
}
