import { useO } from "atom.io/react"
import {
	myIdState,
	usePullMutableFamilyMember,
	useServerAction,
} from "atom.io/realtime-react"
import type { FC } from "react"
import { useParams } from "react-router-dom"

import {
	playersInRooms,
	joinRoomTX,
	leaveRoomTX,
} from "~/apps/node/lodge/src/store/rooms"
import { Id } from "~/packages/hamr/src/react-id"

import { h3 } from "../../containers/<hX>"
import { header } from "../../containers/<header>"
import { Game } from "../Game/Game"
import { myRoomState } from "../Game/store/my-room"
import { PlayersInRoom } from "./PlayersInRoom"
import scss from "./Room.module.scss"

export const Room: FC<{ roomId: string }> = ({ roomId }) => {
	const myId = useO(myIdState)
	const myRoom = useO(myRoomState)

	const iAmInRoom = myRoom === roomId

	const joinRoom = useServerAction(joinRoomTX)
	const leaveRoom = useServerAction(leaveRoomTX)
	usePullMutableFamilyMember(playersInRooms.findRelationsState__INTERNAL, roomId)

	return (
		<article className={scss.class}>
			<header.auspicious0>
				<span>
					<button
						type="button"
						onClick={() => joinRoom({ roomId, playerId: myId ?? `` })}
						disabled={iAmInRoom}
					>
						+
					</button>
					<button
						type="button"
						onClick={() => leaveRoom({ roomId, playerId: myId ?? `` })}
						disabled={!iAmInRoom}
					>
						{`<-`}
					</button>
				</span>
				<Id id={roomId} />
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
