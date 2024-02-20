import { useO } from "atom.io/react"
import { Id } from "hamr/react-id"
import type { FC } from "react"

import { playersInRooms } from "~/apps/core.wayfarer.quest/src/store/rooms"

import scss from "./PlayersInRoom.module.scss"

export const PlayersInRoom: FC<{ roomId: string }> = ({ roomId }) => {
	const playersInRoom = useO(playersInRooms.states.playerEntriesOfRoom(roomId))
	return (
		<div className={scss.class}>
			{playersInRoom.map(([id]) => (
				<Id id={id} key={id} />
			))}
		</div>
	)
}
