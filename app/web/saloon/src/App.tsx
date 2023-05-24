import type { FC } from "react"
import { useEffect } from "react"

import * as A from "atom.io"
import { Link, Route } from "wouter"

import {
  createRoom,
  findPlayersInRoomState,
  joinRoom,
  playersInRoomsState,
  roomsIndex,
} from "~/app/node/lodge/src/store/rooms"

import { ReactComponent as Connected } from "./assets/svg/connected.svg"
import { ReactComponent as Disconnected } from "./assets/svg/disconnected.svg"
import { socketIdState, socket } from "./services/socket"
import { Devtools, useO } from "./services/store"
socket.on(`set:roomsIndex`, (ids) =>
  A.setState(roomsIndex, new Set<string>(ids))
)

A.subscribeToTransaction(createRoom, (update) => {
  socket.emit(`new:room`, update)
})
A.subscribeToTransaction(joinRoom, (update) => {
  socket.emit(`join:room`, update)
})

export const App: FC = () => {
  const myId = useO(socketIdState)
  return (
    <main>
      <div>{myId === null ? <Disconnected /> : <Connected />}</div>
      <h1>Saloon</h1>
      <aside>
        <div>
          {myId} # {myId ? <MyRoom myId={myId} /> : null}
        </div>
      </aside>
      <Route path="/">
        <Lobby />
      </Route>
      <Route path="/room/:roomId">
        {(params) => <Room roomId={params.roomId} />}
      </Route>
      <Devtools />
    </main>
  )
}

export const MyRoom: FC<{ myId: string }> = ({ myId }) => {
  const myRoom = useO(playersInRoomsState).getRelatedId(myId)
  return <span>{myRoom}</span>
}

export const Lobby: FC = () => {
  const roomIds = useO(roomsIndex)
  const socketId = useO(socketIdState)
  return (
    <div>
      <h2>Lobby</h2>
      {[...roomIds].map((roomId) => (
        <Link key={roomId} href={`/room/${roomId}`}>
          {roomId}
        </Link>
      ))}
      <button onClick={() => A.runTransaction(createRoom)()}>Create Room</button>
    </div>
  )
}

export const Room: FC<{ roomId: string }> = ({ roomId }) => {
  const socketId = useO(socketIdState)
  const playersInRoom = useO(findPlayersInRoomState(roomId))

  useEffect(() => {
    socket.emit(`sub:playersInRoom`, roomId)
    return () => {
      socket.emit(`unsub:playersInRoom:${roomId}`)
    }
  }, [roomId])

  useEffect(() => {
    socket.on(
      `set:playersInRoom:${roomId}`,
      (players: { id: string; enteredAt: number }[]) => {
        console.log(`set:playersInRoom:${roomId}`, players)
        return A.setState(findPlayersInRoomState(roomId), players)
      }
    )
    return () => {
      socket.off(`set:playersInRoom:${roomId}`)
    }
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
      <button onClick={() => A.runTransaction(joinRoom)(roomId, socketId ?? ``)}>
        Join Room
      </button>
    </article>
  )
}
