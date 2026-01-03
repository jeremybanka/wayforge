import * as AR from "atom.io/react"
import * as RTC from "atom.io/realtime-client"
import * as RTR from "atom.io/realtime-react"
import * as React from "react"

import { gameContinuity, letterAtoms } from "./game-store"

type RoomNames = `game-instance.bun.ts`

function Room({
	roomSocket,
	myRoomKey,
}: RTR.RealtimeRoomsTools<RoomNames>): React.ReactNode {
	RTR.useSyncContinuity(gameContinuity)
	const letter0 = AR.useO(letterAtoms, 0)
	return (
		<main data-testid={myRoomKey}>
			<h1>{myRoomKey}</h1>
			<p data-testid={letter0}>{letter0}</p>
			<button
				type="button"
				data-testid="leave-room"
				onClick={() => {
					roomSocket?.emit(`leaveRoom`)
				}}
			/>
		</main>
	)
}

function Lobby({
	allRoomKeysAtom,
	roomSocket,
}: RTR.RealtimeRoomsTools<RoomNames>): React.ReactNode {
	const roomKeys = AR.useJSON(allRoomKeysAtom)
	return (
		<main data-testid="lobby">
			{roomKeys.length === 0 ? <p data-testid="no-rooms">No rooms</p> : null}
			<ul>
				{roomKeys.map((roomKey) => (
					<li key={roomKey}>
						<button
							type="button"
							data-testid={`join-${roomKey}`}
							onClick={() => {
								roomSocket?.emit(`joinRoom`, roomKey)
							}}
						/>
						<button
							type="button"
							data-testid={`delete-${roomKey}`}
							onClick={() => {
								roomSocket?.emit(`deleteRoom`, roomKey)
							}}
						/>
					</li>
				))}
			</ul>
			<button
				type="button"
				data-testid="create-room"
				onClick={() => {
					roomSocket?.emit(`createRoom`, `game-instance.bun.ts`)
				}}
			>
				Click me!
			</button>
		</main>
	)
}

function View(): React.ReactNode {
	const roomTools = RTR.useRealtimeRooms<RoomNames>()
	return roomTools.myRoomKey === undefined ? (
		<Lobby {...roomTools} />
	) : (
		<Room {...roomTools} />
	)
}

export function BrowserGame(): React.ReactNode | null {
	const mySocketKey = AR.useO(RTC.mySocketKeyAtom)
	const myUserKey = RTR.usePullAtom(RTC.myUserKeyAtom)

	return mySocketKey && myUserKey ? <View /> : <div data-testid="disconnected" />
}
