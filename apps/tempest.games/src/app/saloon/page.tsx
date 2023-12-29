"use client"

import { useJSON } from "atom.io/react"
import { usePullMutable, useServerAction } from "atom.io/realtime-react"
import Link from "next/link"

import { createRoomTX, roomsIndex } from "~/apps/node/lodge/src/store/rooms"

export default function Saloon(): JSX.Element {
	const roomKeys = useJSON(roomsIndex)
	const runCreateRoom = useServerAction(createRoomTX)
	usePullMutable(roomsIndex)

	return (
		<div>
			<h2>Lobby</h2>
			{roomKeys.members.map((roomId) => (
				<Link key={roomId} href={`saloon/${roomId}`}>
					{roomId}
				</Link>
			))}
			<button
				type="button"
				onClick={() => {
					// debugger
					runCreateRoom()
				}}
			>
				Create Room
			</button>
		</div>
	)
}
