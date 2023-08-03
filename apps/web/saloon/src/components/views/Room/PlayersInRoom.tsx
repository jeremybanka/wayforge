import { useO } from "atom.io/react"
import { Id } from "hamr/react-id"
import type { FC } from "react"

import { findPlayersInRoomState } from "~/apps/node/lodge/src/store/rooms"

import scss from "./PlayersInRoom.module.scss"

export const PlayersInRoom: FC<{ roomId: string }> = ({ roomId }) => {
	const playersInRoom = useO(findPlayersInRoomState(roomId))
	return (
		<div className={scss.class}>
			{playersInRoom.map((player) => (
				<Id id={player.id} key={player.id} />
			))}
		</div>
	)
}
