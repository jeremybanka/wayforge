"use client"

import { findRelations, getInternalRelations } from "atom.io/data"
import { findState } from "atom.io/ephemeral"
import { useI, useO } from "atom.io/react"
import { usersInRooms } from "atom.io/realtime"
import { myUsernameState } from "atom.io/realtime-client"
import * as RTR from "atom.io/realtime-react"
import { Id } from "hamr/react-id"
import { Radial } from "hamr/react-radial"
import * as React from "react"
import { header } from "wayfarer.quest/components/<header>"
import { Game } from "wayfarer.quest/game/Game"
import { windowMousePositionState } from "wayfarer.quest/services/peripherals/mouse-position"
import {
	actionsState,
	radialModeState,
} from "wayfarer.quest/services/peripherals/radial"
import { roomViewState } from "wayfarer.quest/services/store/room-view-state"

import scss from "./page.module.scss"
import { UsersInRoom } from "./PlayersInRoom"

export default function Room({ roomId }: { roomId: string }): JSX.Element {
	const { socket } = React.useContext(RTR.RealtimeContext)

	const myUsername = useO(myUsernameState)
	const myRoomKey = useO(findRelations(usersInRooms, myUsername).roomKeyOfUser)
	const setRoomState = useI(roomViewState)
	console.log({ myUsername, myRoomKey, roomId })

	const usersInRoomsInternal = getInternalRelations(usersInRooms)
	RTR.usePullMutableAtomFamilyMember(usersInRoomsInternal, roomId)
	RTR.usePullMutable(findState(usersInRoomsInternal, myUsername))

	return (
		<>
			<article className={scss.class}>
				<button
					key={roomId}
					type="button"
					onClick={() => {
						setRoomState(null)
					}}
				>
					Lobby
				</button>
				<header.auspicious0>
					<span>
						<button
							type="button"
							onClick={() => {
								if (socket) {
									socket.emit(`join-room`, roomId)
								} else {
									console.log(`socket is null`)
								}
							}}
							disabled={myRoomKey !== null}
						>
							+
						</button>
						<button
							type="button"
							onClick={() => {
								if (socket) {
									socket.emit(`leave-room`, roomId)
								} else {
									console.log(`socket is null`)
								}
							}}
							disabled={myRoomKey === null}
						>
							{`<-`}
						</button>
					</span>
					<Id id={roomId} />
					<UsersInRoom roomId={roomId} />
				</header.auspicious0>

				{myRoomKey === null ? null : <Game roomId={roomId} />}
			</article>
			<Radial
				useMode={() => [useO(radialModeState), useI(radialModeState)]}
				useActions={() => useO(actionsState)}
				useMousePosition={() => useO(windowMousePositionState)}
			/>
		</>
	)
}
