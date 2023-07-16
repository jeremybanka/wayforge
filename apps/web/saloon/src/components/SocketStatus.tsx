import { css } from "@emotion/react"
import { useO } from "atom.io/react"
import type { FC } from "react"
import { useState } from "react"


import { myIdState } from "~/packages/atom.io/src/realtime-react"

import { myRoomState } from "./views/Game/store/my-room"
import { ReactComponent as Connected } from "../assets/svg/connected.svg"
import { ReactComponent as Disconnected } from "../assets/svg/disconnected.svg"

export const MyRoom: FC = () => {
	const myRoom = useO(myRoomState)
	return <span>{myRoom}</span>
}

export const SocketStatus: FC = () => {
	const myId = useO(myIdState)
	const [isOpen, setIsOpen] = useState(false)
	const toggleOpen = () => setIsOpen((isOpen) => !isOpen)
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
			<div className="icon" onClick={toggleOpen} onKeyUp={toggleOpen}>
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
