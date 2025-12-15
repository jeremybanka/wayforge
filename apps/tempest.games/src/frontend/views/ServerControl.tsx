import { useJSON, useO } from "atom.io/react"
import { type RoomKey, roomKeysAtom } from "atom.io/realtime"
import type { RealtimeRoomsTools } from "atom.io/realtime-react"
import { usePullAtom, useRealtimeRooms } from "atom.io/realtime-react"
import * as React from "react"

import type { ActualWorkerName } from "../../backend.worker"
import { cpuCountAtom } from "../../library/store"
import type { GameProps } from "./Game"

export function ServerControl({ userKey }: GameProps): React.ReactNode {
	const cpuCount = usePullAtom(cpuCountAtom)
	const allRoomKeys = useJSON(roomKeysAtom)
	const {
		myRoomKey,
		myOwnedRoomsAtom,
		socket: roomSocket,
	} = useRealtimeRooms<ActualWorkerName>(userKey)

	const myOwnedRoomKeys = useO(myOwnedRoomsAtom)

	return (
		<article data-css="server-control">
			{Array.from({ length: cpuCount }).map((_, i) => {
				const roomKey: RoomKey | undefined = allRoomKeys[i]
				const hasJoined = roomKey === myRoomKey
				const ownsRoom = myOwnedRoomKeys.has(roomKey)
				return (
					<Core
						key={i}
						indexNumber={i}
						roomKey={roomKey}
						roomSocket={roomSocket}
						ownsRoom={ownsRoom}
						hasJoined={hasJoined}
					/>
				)
			})}
			<button
				type="button"
				onClick={() => {
					roomSocket.emit(`createRoom`, `backend.worker.bug-rangers.bun`)
				}}
			>
				create room
			</button>
		</article>
	)
}

type CoreProps = {
	indexNumber: number
	roomKey?: RoomKey
	hasJoined?: boolean
	ownsRoom?: boolean
	roomSocket: RealtimeRoomsTools[`socket`]
}
function Core({
	indexNumber,
	roomKey,
	hasJoined,
	ownsRoom,
	roomSocket,
}: CoreProps) {
	return (
		<div data-css="">
			<span>
				Core {indexNumber}: {roomKey}
				{` `}
				<input type="checkbox" checked={ownsRoom} disabled />
				<input type="checkbox" checked={hasJoined} disabled />
			</span>
			{roomKey === undefined ? null : hasJoined ? (
				<button
					type="button"
					onClick={() => {
						roomSocket.emit(`leaveRoom`)
					}}
				>
					leave
				</button>
			) : (
				<button
					type="button"
					onClick={() => {
						roomSocket.emit(`joinRoom`, roomKey)
					}}
				>
					join
				</button>
			)}
			{roomKey && ownsRoom ? (
				<button
					type="button"
					onClick={() => {
						roomSocket.emit(`deleteRoom`, roomKey)
					}}
				>
					delete
				</button>
			) : null}
		</div>
	)
}
