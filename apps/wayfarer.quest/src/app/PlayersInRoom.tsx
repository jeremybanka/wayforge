import { useO } from "atom.io/react"
import { usersInRooms } from "atom.io/realtime"
import { Id } from "hamr/react-id"
import type { FC } from "react"

import scss from "./PlayersInRoom.module.scss"

export const UsersInRoom: FC<{ roomId: string }> = ({ roomId }) => {
	const userKeysOfRoom = useO(usersInRooms.states.userKeysOfRoom, roomId)
	return (
		<div className={scss.class}>
			{userKeysOfRoom.map((id) => (
				<Id id={id} key={id} />
			))}
		</div>
	)
}
