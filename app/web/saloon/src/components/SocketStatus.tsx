import type { FC } from "react"
import { useState } from "react"

import { css } from "@emotion/react"
import * as AtomIO from "atom.io"
import { useO } from "atom.io/react"

import { playersInRoomsState } from "~/app/node/lodge/src/store/rooms"

import { ReactComponent as Connected } from "../assets/svg/connected.svg"
import { ReactComponent as Disconnected } from "../assets/svg/disconnected.svg"
import { socketIdState } from "../services/store"

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

export const SocketStatus: FC = () => {
  const myId = useO(socketIdState)
  const [isOpen, setIsOpen] = useState(false)
  return (
    <aside
      css={css`
        position: absolute;
        top: 0;
        right: 0;
        border: 1px solid var(--fg-color);
        background: var(--bg-color);
        display: flex;
        flex-direction: row-reverse;
        .icon {
          user-select: none;
          width: 45px;
          height: 45px;
          svg {
            width: 45px;
            height: 45px;
          }
        }
      `}
    >
      <div className="icon" onClick={() => setIsOpen((isOpen) => !isOpen)}>
        {myId === null ? <Disconnected /> : <Connected />}
      </div>
      {isOpen ? (
        <div className="details">
          {myId} # <MyRoom />
        </div>
      ) : null}
    </aside>
  )
}
