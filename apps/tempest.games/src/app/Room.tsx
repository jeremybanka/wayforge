"use client"

import { useI, useO } from "atom.io/react"
import { myIdState } from "atom.io/realtime-client"
import {
	usePullMutableFamilyMember,
	useServerAction,
} from "atom.io/realtime-react"
import { Id } from "hamr/react-id"
import { Radial } from "hamr/react-radial"

import {
	joinRoomTX,
	leaveRoomTX,
	playersInRooms,
} from "~/apps/node/lodge/src/store/rooms"

import { header } from "tempest.games/components/<header>"
import { Game } from "tempest.games/game/Game"
import { windowMousePositionState } from "tempest.games/services/peripherals/mouse-position"
import {
	actionsState,
	radialModeState,
} from "tempest.games/services/peripherals/radial"
import { myRoomState } from "tempest.games/services/store/my-room"
import { roomViewState } from "tempest.games/services/store/room-view-state"
import { PlayersInRoom } from "./PlayersInRoom"

import scss from "./page.module.scss"

export default function Room({ roomId }: { roomId: string }): JSX.Element {
	const myId = useO(myIdState)
	const myRoom = useO(myRoomState)
	const setRoomState = useI(roomViewState)
	const iAmInRoom = myRoom === roomId

	const joinRoom = useServerAction(joinRoomTX)
	const leaveRoom = useServerAction(leaveRoomTX)
	const playersInRoomState = playersInRooms.core.findRelatedKeysState(roomId)
	usePullMutableFamilyMember(playersInRoomState)

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
