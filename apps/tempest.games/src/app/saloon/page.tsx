"use client"

import { useO } from "atom.io/react"
import { usePullMutable, useServerAction } from "atom.io/realtime-react"
import Link from "next/link"

import { createRoomTX, roomsIndex } from "~/apps/node/lodge/src/store/rooms"

export default function Saloon(): JSX.Element {
	const roomIds = useO(roomsIndex)
	const runCreateRoom = useServerAction(createRoomTX)
	usePullMutable(roomsIndex)

	return (
		<div>
			<h2>Lobby</h2>
			{[...roomIds].map((roomId) => (
				<Link key={roomId} href={`saloon/${roomId}`}>
					{roomId}
				</Link>
			))}
			<button type="button" onClick={() => runCreateRoom()}>
				Create Room
			</button>
		</div>
	)
}
