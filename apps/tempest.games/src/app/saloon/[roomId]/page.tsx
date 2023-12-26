"use client"

import { useO } from "atom.io/react"
import { myIdState } from "atom.io/realtime-client"
import {
	usePullMutableFamilyMember,
	useServerAction,
} from "atom.io/realtime-react"

import {
	joinRoomTX,
	leaveRoomTX,
	playersInRooms,
} from "~/apps/node/lodge/src/store/rooms"
import { Id } from "~/packages/hamr/src/react-id"

import { header } from "src/components/<header>"
import { myRoomState } from "src/services/store/my-room"
import { Game } from "./Game"
import { PlayersInRoom } from "./PlayersInRoom"
import scss from "./Room.module.scss"

export default function Room({
	params: { roomId },
}: { params: { roomId: string } }): JSX.Element {
	const myId = useO(myIdState)
	const myRoom = useO(myRoomState)

	const iAmInRoom = myRoom === roomId

	const joinRoom = useServerAction(joinRoomTX)
	const leaveRoom = useServerAction(leaveRoomTX)
	const playersInRoomState = playersInRooms.core.findRelatedKeysState(roomId)
	usePullMutableFamilyMember(playersInRoomState)

	return (
		<article className={scss.class}>
			<header.auspicious0>
				<span>
					<button
						type="button"
						onClick={() => {
							joinRoom({ roomId, playerId: myId ?? `` })
						}}
						disabled={iAmInRoom}
					>
						+
					</button>
					<button
						type="button"
						onClick={() => {
							leaveRoom({ roomId, playerId: myId ?? `` })
						}}
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
