import { useO } from "atom.io/react"
import { usePullMutable, useServerAction } from "atom.io/realtime-react"
import type { FC } from "react"
import { Link } from "react-router-dom"

import { createRoomTX, roomsIndex } from "~/apps/node/lodge/src/store/rooms"

export const Lobby: FC = () => {
	const roomIds = useO(roomsIndex)
	const runCreateRoom = useServerAction(createRoomTX)
	usePullMutable(roomsIndex)

	return (
		<div>
			<h2>Lobby</h2>
			{[...roomIds].map((roomId) => (
				<Link key={roomId} to={`/room/${roomId}`}>
					{roomId}
				</Link>
			))}
			<button type="button" onClick={() => runCreateRoom()}>
				Create Room
			</button>
		</div>
	)
}
