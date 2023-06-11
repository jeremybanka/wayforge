import type { FC } from "react"

import { useO } from "atom.io/react"
import { Link } from "react-router-dom"

import { createRoomTX, roomsIndex } from "~/app/node/lodge/src/store/rooms"
import { stringSetJsonInterface } from "~/packages/anvl/src/json"

import { useRemoteState, useRemoteTransaction } from "../../services/store"

export const Lobby: FC = () => {
  const roomIds = useO(roomsIndex)
  const runCreateRoom = useRemoteTransaction(createRoomTX)
  useRemoteState(roomsIndex, stringSetJsonInterface)
  return (
    <div>
      <h2>Lobby</h2>
      {[...roomIds].map((roomId) => (
        <Link key={roomId} to={`/room/${roomId}`}>
          {roomId}
        </Link>
      ))}
      <button onClick={() => runCreateRoom()}>Create Room</button>
    </div>
  )
}
