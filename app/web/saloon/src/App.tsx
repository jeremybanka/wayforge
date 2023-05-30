import type { FC } from "react"

import * as AtomIO from "atom.io"
import { useO } from "atom.io/react"
import { AtomIODevtools } from "atom.io/react-devtools"
import { Link, Route } from "wouter"

import {
  createRoomTX,
  findPlayersInRoomState,
  joinRoomTX,
  leaveRoomTX,
  playersInRoomsState,
  roomsIndex,
} from "~/app/node/lodge/src/store/rooms"
import { stringSetJsonInterface } from "~/packages/anvl/src/json"

import { ReactComponent as Connected } from "./assets/svg/connected.svg"
import { ReactComponent as Disconnected } from "./assets/svg/disconnected.svg"
import {
  socketIdState,
  useRemoteTransaction,
  useRemoteFamily,
  useRemoteState,
} from "./services/store"

export const App: FC = () => {
  const myId = useO(socketIdState)
  return (
    <main>
      <div>{myId === null ? <Disconnected /> : <Connected />}</div>
      <h1>Saloon</h1>
      <aside>
        <div>
          {myId} # <MyRoom />
        </div>
      </aside>
      <Route path="/">
        <Lobby />
      </Route>
      <Route path="/room/:roomId">
        {(params) => <Room roomId={params.roomId} />}
      </Route>
      <AtomIODevtools />
    </main>
  )
}

const myRoomState = AtomIO.selector<string | null>({
  key: `myRoom`,
  get: ({ get }) => {
    const socketId = get(socketIdState)
    return socketId
      ? get(playersInRoomsState).getRelatedId(socketId) ?? null
      : null
  },
})

export const MyRoom: FC = () => {
  const myRoom = useO(myRoomState)
  return <span>{myRoom}</span>
}

export const Lobby: FC = () => {
  const roomIds = useO(roomsIndex)
  const runCreateRoom = useRemoteTransaction(createRoomTX)
  useRemoteState(roomsIndex, stringSetJsonInterface)
  return (
    <div>
      <h2>Lobby</h2>
      {[...roomIds].map((roomId) => (
        <Link key={roomId} href={`/room/${roomId}`}>
          {roomId}
        </Link>
      ))}
      <button onClick={() => runCreateRoom()}>Create Room</button>
    </div>
  )
}

export const Room: FC<{ roomId: string }> = ({ roomId }) => {
  const socketId = useO(socketIdState)
  const playersInRoom = useO(findPlayersInRoomState(roomId))
  const iAmInRoom = playersInRoom.some((player) => player.id === socketId)

  const joinRoom = useRemoteTransaction(joinRoomTX)
  const leaveRoom = useRemoteTransaction(leaveRoomTX)
  useRemoteFamily(findPlayersInRoomState, roomId, {
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
    </article>
  )
}
