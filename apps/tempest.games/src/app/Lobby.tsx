"use client"

import { useJSON } from "atom.io/react"
import { useI } from "atom.io/react"
import { usePullMutable, useServerAction } from "atom.io/realtime-react"

import { createRoomTX, roomsIndex } from "~/apps/node/lodge/src/store/rooms"

import { roomViewState } from "src/services/store/room-view-state"

export default function Lobby(): JSX.Element {
	const roomKeys = useJSON(roomsIndex)
	const runCreateRoom = useServerAction(createRoomTX)
	usePullMutable(roomsIndex)
	const setRoomState = useI(roomViewState)

	return (
		<div>
			<h2>Lobby</h2>
			{roomKeys.members.map((roomId) => (
				<button
					key={roomId}
					type="button"
					onClick={() => {
						setRoomState(roomId)
					}}
				>
					{roomId}
				</button>
			))}
			<button
				type="button"
				onClick={() => {
					runCreateRoom()
				}}
			>
				Create Room
			</button>
		</div>
	)
}
