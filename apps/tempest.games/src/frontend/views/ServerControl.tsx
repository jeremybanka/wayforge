import type { RoomKey } from "@atom.io/realtime"
import type { Children } from "@atom.io/spa"

import type { ActualRoomName } from "../../library/room-names"
import { cpuCountAtom } from "../../library/store"
import type { RealtimeRoomsTools } from "../services/realtime-hooks"
import { usePullAtom, useRealtimeRooms } from "../services/realtime-hooks"
import css from "./ServerControl.module.css"

export function ServerControl(): Children {
	const cpuCount = usePullAtom(cpuCountAtom)
	const { allRoomKeys, myRoomKey, myOwnedRoomKeys, roomSocket } =
		useRealtimeRooms<ActualRoomName>()

	return (
		<server-control className={css.class}>
			{Array.from({ length: cpuCount() }).map((_, i) => {
				const roomKey: RoomKey | undefined = allRoomKeys()[i]
				const hasJoined = roomKey && roomKey === myRoomKey()
				const ownsRoom =
					roomKey !== undefined && myOwnedRoomKeys().includes(roomKey)
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
		</server-control>
	)
}

type CoreProps = {
	indexNumber: number
	roomKey?: RoomKey | undefined
	hasJoined?: boolean | undefined
	ownsRoom?: boolean | undefined
	roomSocket: RealtimeRoomsTools<ActualRoomName>[`roomSocket`]
}
function Core(props: CoreProps) {
	return (
		<server-core>
			<span>
				Core {props.indexNumber}: {props.roomKey}
				{` `}
				<input type="checkbox" checked={props.ownsRoom} disabled />
				<input type="checkbox" checked={props.hasJoined} disabled />
			</span>
			{props.roomKey === undefined ? null : props.hasJoined ? (
				<button
					type="button"
					onClick={() => {
						props.roomSocket.emit(`leaveRoom`)
					}}
				>
					leave
				</button>
			) : (
				<button
					type="button"
					onClick={() => {
						props.roomSocket.emit(`joinRoom`, props.roomKey!)
					}}
				>
					join
				</button>
			)}
			{props.roomKey && props.ownsRoom ? (
				<button
					type="button"
					onClick={() => {
						props.roomSocket.emit(`deleteRoom`, props.roomKey!)
					}}
				>
					delete
				</button>
			) : null}
		</server-core>
	)
}
