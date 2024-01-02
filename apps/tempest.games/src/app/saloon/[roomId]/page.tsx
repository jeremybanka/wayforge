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

import { header } from "src/components/<header>"
import { Game } from "src/game/Game"
import { windowMousePositionState } from "src/services/peripherals/mouse-position"
import { actionsState, radialModeState } from "src/services/peripherals/radial"
import { myRoomState } from "src/services/store/my-room"
import { PlayersInRoom } from "./PlayersInRoom"

import Link from "next/link"
import scss from "./page.module.scss"

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
		<>
			<article className={scss.class}>
				<Link href="/saloon">Lobby</Link>
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
