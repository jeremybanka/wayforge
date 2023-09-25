import { useO } from "atom.io/react"
import { myIdState } from "atom.io/realtime-client"
import type { FC } from "react"
import { useState } from "react"

import { ReactComponent as Connected } from "../assets/svg/connected.svg"
import { ReactComponent as Disconnected } from "../assets/svg/disconnected.svg"
import scss from "./SocketStatus.module.scss"
import { myRoomState } from "./views/Game/store/my-room"

export const MyRoom: FC = () => {
	const myRoom = useO(myRoomState)
	return <span>{myRoom}</span>
}

export const SocketStatus: FC = () => {
	const myId = useO(myIdState)
	const [isOpen, setIsOpen] = useState(false)
	const toggleOpen = () => setIsOpen((isOpen) => !isOpen)
	return (
		<aside className={scss.class}>
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
