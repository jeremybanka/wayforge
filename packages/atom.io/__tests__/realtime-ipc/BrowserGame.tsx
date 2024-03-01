import { arbitrary } from "atom.io/internal"
import * as AR from "atom.io/react"
import * as RT from "atom.io/realtime"
import * as RTC from "atom.io/realtime-client"
import * as RTR from "atom.io/realtime-react"
import * as React from "react"

import { gameContinuity, letterAtoms } from "./game-store"

function Room({ roomId }: { roomId: string }): JSX.Element {
	const { socket } = React.useContext(RTR.RealtimeContext)
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
					socket?.emit(`leave-room`)
				}}
			/>
		</main>
	)
}

function Lobby(): JSX.Element {
	const { socket } = React.useContext(RTR.RealtimeContext)
	RTR.usePullMutable(RT.roomIndex)
	const roomKeys = AR.useJSON(RT.roomIndex)
	return (
		<main>
			{roomKeys.members.length === 0 ? (
				<p data-testid="no-rooms">No rooms</p>
			) : null}
			<ul>
				{roomKeys.members.map((roomKey) => (
					<li key={roomKey}>
						<button
							type="button"
							data-testid={`join-${roomKey}`}
							onClick={() => {
								console.log(`🥋 JOIN ROOM CLICKED`, socket)
								socket?.emit(`join-room`, roomKey)
							}}
						/>
						<button
							type="button"
							data-testid={`delete-${roomKey}`}
							onClick={() => {
								socket?.emit(`delete-room`, roomKey)
							}}
						/>
					</li>
				))}
			</ul>
			<button
				type="button"
				data-testid="create-room"
				onClick={() => {
					socket?.emit(`create-room`, `room-1`)
				}}
			>
				Click me!
			</button>
		</main>
	)
}

function View({ myUsername }: { myUsername: string }): JSX.Element {
	const myRoomKey = RTR.usePullSelector(
		RT.usersInRooms.states.roomKeyOfUser(myUsername),
	)
	return myRoomKey ? <Room roomId={myRoomKey} /> : <Lobby />
}

export function BrowserGame(): JSX.Element | null {
	const socketId = AR.useO(RTC.myIdState)
	const myUsername = AR.useO(RTC.myUsernameState)

	return socketId && myUsername ? <View myUsername={myUsername} /> : null
}
