"use client"

import { useJSON } from "atom.io/react"
import { useI } from "atom.io/react"
import { roomIndex } from "atom.io/realtime"
import * as RTR from "atom.io/realtime-react"
import { usePullMutable } from "atom.io/realtime-react"
import * as React from "react"

import { roomViewState } from "wayfarer.quest/services/store/room-view-state"

export default function Lobby(): JSX.Element {
	const { socket } = React.useContext(RTR.RealtimeContext)

	const roomKeys = useJSON(roomIndex)
	usePullMutable(roomIndex)
	const setRoomState = useI(roomViewState)

	return (
		<div>
			<h2>Lobby</h2>
			{roomKeys.members.map((roomId) => (
				<>
					<button
						key={roomId}
						type="button"
						onClick={() => {
							setRoomState(roomId)
						}}
					>
						{roomId}
					</button>
					<button
						type="button"
						onClick={() => {
							if (socket) {
								socket.emit(`delete-room`, `room-1`)
							} else {
								console.log(`socket is null`)
							}
						}}
					>
						x
					</button>
				</>
			))}
			<button
				type="button"
				onClick={() => {
					if (socket) {
						socket.emit(`create-room`, `room-1`)
					} else {
						console.log(`socket is null`)
					}
				}}
			>
				Create Room
			</button>
		</div>
	)
}
