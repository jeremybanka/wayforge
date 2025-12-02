import { getInternalRelations } from "atom.io"
import { useJSON, useO } from "atom.io/react"
import type { RoomKey, UserKey } from "atom.io/realtime"
import { ownersOfRooms, roomKeysAtom, usersInRooms } from "atom.io/realtime"
import {
	usePullAtom,
	usePullMutable,
	usePullMutableAtomFamilyMember,
	useRealtimeRooms,
} from "atom.io/realtime-react"
import * as React from "react"

import type { ActualWorkerName } from "../../backend.worker"
import { cpuCountAtom } from "../../library/store"
import { authAtom } from "../services/socket-auth-service"

export function ServerControl(): React.ReactNode {
	const cpuCount = usePullAtom(cpuCountAtom)
	usePullMutable(roomKeysAtom)
	const roomKeys = useJSON(roomKeysAtom)
	const userKey = `user::${useO(authAtom)!.userId}` satisfies UserKey
	usePullMutableAtomFamilyMember(
		getInternalRelations(usersInRooms, `split`)[1],
		userKey,
	)
	const myJoinedRoomKeys = useJSON(
		getInternalRelations(usersInRooms, `split`)[1],
		userKey,
	)
	const myOwnedRoomKeys = usePullMutableAtomFamilyMember(
		getInternalRelations(ownersOfRooms, `split`)[0],
		userKey,
	)

	const roomSocket = useRealtimeRooms<ActualWorkerName>()

	return (
		<article data-css="server-control">
			{Array.from({ length: cpuCount }).map((_, i) => {
				const roomKey: RoomKey | undefined = roomKeys[i]
				const hasJoined = myJoinedRoomKeys.includes(roomKey)
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
					roomSocket.emit(`createRoom`, `backend.worker.game.bun`)
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
	roomSocket: ReturnType<typeof useRealtimeRooms>
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
