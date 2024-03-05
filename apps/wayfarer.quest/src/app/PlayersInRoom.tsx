import { useO } from "atom.io/react"
import { usersInRooms } from "atom.io/realtime"
import { Id } from "hamr/react-id"
import type { FC } from "react"

import { findRelations } from "atom.io/data"
import scss from "./PlayersInRoom.module.scss"

export const UsersInRoom: FC<{ roomId: string }> = ({ roomId }) => {
	const userKeysOfRoom = useO(findRelations(usersInRooms, roomId).userKeysOfRoom)
	return (
		<div className={scss.class}>
			{userKeysOfRoom.map((id) => (
				<Id id={id} key={id} />
			))}
		</div>
	)
}
