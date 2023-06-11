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
import { header } from "../../containers/<header>"
import { h3 } from "../../containers/<hX>"
import { Game } from "../Game/Game"
import { myRoomState } from "../Game/store/my-room"

export const PlayersInRoom: FC<{ roomId: string }> = ({ roomId }) => {
  const playersInRoom = useO(findPlayersInRoomState(roomId))
  return (
    <div
      css={css`
        display: flex;
        flex-flow: row;
        div {
          display: flex;
          justify-content: center;
          align-items: center;
          border-radius: 50%;
          height: 50px;
          width: 50px;
          border: 1px solid var(--fg-color);
        }
      `}
    >
      {playersInRoom.map((player) => (
        <div key={player.id}>{player.id.slice(0, 2)}</div>
      ))}
    </div>
  )
}

export const Room: FC<{ roomId: string }> = ({ roomId }) => {
  const socketId = useO(socketIdState)
  const myRoom = useO(myRoomState)

  const iAmInRoom = myRoom === roomId

  const joinRoom = useRemoteTransaction(joinRoomTX)
  const leaveRoom = useRemoteTransaction(leaveRoomTX)
  useRemoteFamilyMember(findPlayersInRoomState, roomId, {
    fromJson: (json) => json,
    toJson: (value) => value,
  })

  return (
    <article
      className="room"
      css={css`
        display: flex;
        flex-direction: column;
        align-items: center;
        overflow: hidden;
        header {
          height: 75px;
          display: inline-flex;
          justify-content: center;
          align-items: center;
          gap: 10px;
          padding: 0 10px;
          span {
            display: flex;
            flex-direction: column;
            button {
              font-family: theia;
            }
          }
          h2 {
            font-family: Manufab;
            font-size: 50px;
            margin: 0;
          }
        }
      `}
    >
      <header.auspicious0>
        <span>
          <button
            onClick={() => joinRoom({ roomId, playerId: socketId ?? `` })}
            disabled={iAmInRoom}
          >
            +
          </button>
          <button
            onClick={() => leaveRoom({ roomId, playerId: socketId ?? `` })}
            disabled={!iAmInRoom}
          >
            {`<-`}
          </button>
        </span>
        <h2>{roomId.slice(0, 2)}</h2>
        <PlayersInRoom roomId={roomId} />
      </header.auspicious0>

      {iAmInRoom ? <Game /> : null}
    </article>
  )
}

export const RoomRoute: FC = () => {
  const { roomId } = useParams<{ roomId: string }>()
  return roomId ? <Room roomId={roomId} /> : <h3.wedge>Room not found</h3.wedge>
}
