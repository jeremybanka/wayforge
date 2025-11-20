import { findRelationsInStore } from "atom.io/internal"
import * as AR from "atom.io/react"
import * as RT from "atom.io/realtime"
import * as RTC from "atom.io/realtime-client"
import * as RTR from "atom.io/realtime-react"
import * as React from "react"

import { gameContinuity, letterAtoms } from "./game-store"

type RoomNames = `game-instance.bun.ts`

function Room({ roomId }: { roomId: string }): React.ReactNode {
	const socket = RTR.useRealtimeRooms<RoomNames>()
	RTR.useSyncContinuity(gameContinuity)
	const letter0 = AR.useO(letterAtoms, 0)
	return (
		<main data-testid={roomId}>
			<h1>{roomId}</h1>
			<p data-testid={letter0}>{letter0}</p>
			<button
				type="button"
				data-testid="leave-room"
				onClick={() => {
					socket?.emit(`leaveRoom:${roomId}`)
				}}
			/>
		</main>
	)
}

function Lobby(): React.ReactNode {
	const socket = RTR.useRealtimeRooms<RoomNames>()
	RTR.usePullMutable(RT.roomKeysAtom)
	const roomKeys = AR.useJSON(RT.roomKeysAtom)
	return (
		<main>
			{roomKeys.length === 0 ? <p data-testid="no-rooms">No rooms</p> : null}
			<ul>
				{roomKeys.map((roomKey) => (
					<li key={roomKey}>
						<button
							type="button"
							data-testid={`join-${roomKey}`}
							onClick={() => {
								socket?.emit(`joinRoom`, roomKey)
							}}
						/>
						<button
							type="button"
							data-testid={`delete-${roomKey}`}
							onClick={() => {
								socket?.emit(`deleteRoom:${roomKey}`)
							}}
						/>
					</li>
				))}
			</ul>
			<button
				type="button"
				data-testid="create-room"
				onClick={() => {
					socket?.emit(`createRoom`, `game-instance.bun.ts`)
				}}
			>
				Click me!
			</button>
		</main>
	)
}

function View({
	myUserKey: myUsername,
}: {
	myUserKey: RT.UserKey
}): React.ReactNode {
	const store = React.useContext(AR.StoreContext)
	const myRoomKeyState = findRelationsInStore(
		store,
		RT.usersInRooms,
		myUsername,
	).roomKeyOfUser
	const myRoomKey = RTR.usePullSelector(myRoomKeyState)
	return myRoomKey ? <Room roomId={myRoomKey} /> : <Lobby />
}

export function BrowserGame(): React.ReactNode | null {
	const mySocketKey = AR.useO(RTC.mySocketKeyAtom)
	const myUserKey = AR.useO(RTC.myUserKeyAtom)

	return mySocketKey && myUserKey ? <View myUserKey={myUserKey} /> : null
}
