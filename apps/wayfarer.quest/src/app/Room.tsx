"use client"

import { useI, useO } from "atom.io/react"
import { myIdState } from "atom.io/realtime-client"
import * as RTR from "atom.io/realtime-react"
import {
	usePullMutableAtomFamilyMember,
	useServerAction,
} from "atom.io/realtime-react"
import { Id } from "hamr/react-id"
import { Radial } from "hamr/react-radial"
import * as React from "react"
import { joinRoomTX, leaveRoomTX } from "~/apps/node/lodge/src/store/rooms"

import { header } from "wayfarer.quest/components/<header>"
import { Game } from "wayfarer.quest/game/Game"
import { windowMousePositionState } from "wayfarer.quest/services/peripherals/mouse-position"
import {
	actionsState,
	radialModeState,
} from "wayfarer.quest/services/peripherals/radial"
import { myRoomState } from "wayfarer.quest/services/store/my-room"
import { roomViewState } from "wayfarer.quest/services/store/room-view-state"

import { usersInRooms } from "atom.io/realtime-server"
import { UsersInRoom } from "./PlayersInRoom"
import scss from "./page.module.scss"

export default function Room({ roomId }: { roomId: string }): JSX.Element {
	const { socket } = React.useContext(RTR.RealtimeContext)

	const myId = useO(myIdState)
	const myRoom = useO(myRoomState)
	const setRoomState = useI(roomViewState)
	const iAmInRoom = myRoom === roomId

	const joinRoom = useServerAction(joinRoomTX)
	const leaveRoom = useServerAction(leaveRoomTX)
	usePullMutableAtomFamilyMember(usersInRooms.core.findRelatedKeysState, roomId)

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
							disabled={iAmInRoom}
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
							disabled={!iAmInRoom}
						>
							{`<-`}
						</button>
					</span>
					<Id id={roomId} />
					<UsersInRoom roomId={roomId} />
				</header.auspicious0>

				{iAmInRoom ? <Game roomId={roomId} /> : null}
			</article>
			<Radial
				/* eslint-disable react-hooks/rules-of-hooks */
				useMode={() => [useO(radialModeState), useI(radialModeState)]}
				useActions={() => useO(actionsState)}
				useMousePosition={() => useO(windowMousePositionState)}
				/* eslint-enable react-hooks/rules-of-hooks */
			/>
		</>
	)
}
