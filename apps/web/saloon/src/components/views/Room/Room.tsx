import { useO } from "atom.io/react"
import type { FC } from "react"
import { useParams } from "react-router-dom"

import {
	findPlayersInRoomState,
	joinRoomTX,
	leaveRoomTX,
} from "~/apps/node/lodge/src/store/rooms"
import {
	myIdState,
	usePullFamilyMember,
	useServerAction,
} from "~/packages/atom.io/src/realtime-react"

import { PlayersInRoom } from "./PlayersInRoom"
import scss from "./Room.module.scss"
import { header } from "../../containers/<header>"
import { h3 } from "../../containers/<hX>"
import { Game } from "../Game/Game"
import { myRoomState } from "../Game/store/my-room"

export const Room: FC<{ roomId: string }> = ({ roomId }) => {
	const myId = useO(myIdState)
	const myRoom = useO(myRoomState)

	const iAmInRoom = myRoom === roomId

	const joinRoom = useServerAction(joinRoomTX)
	const leaveRoom = useServerAction(leaveRoomTX)
	usePullFamilyMember(findPlayersInRoomState, roomId)

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
