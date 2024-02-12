import * as AR from "atom.io/react"
import * as RT from "atom.io/realtime"
import * as RTR from "atom.io/realtime-react"
import * as React from "react"

import { myIdState } from "../../realtime-client/src/realtime-client-stores"
import { gameContinuity, letterAtoms } from "./game-store"

function Room({ roomId }: { roomId: string }): JSX.Element {
	RTR.useSyncContinuity(gameContinuity)
	const letter0 = AR.useO(letterAtoms, 0)
	return (
		<main data-testid={roomId}>
			<h1>{roomId}</h1>
			<p data-testid={letter0}>{letter0}</p>
		</main>
	)
}

function Lobby(): JSX.Element {
	const { socket } = React.useContext(RTR.RealtimeContext)
	RTR.usePullMutable(RT.roomIndex)
	const roomKeys = AR.useJSON(RT.roomIndex)
	return (
		<main>
			<ul>
				{roomKeys.members.map((roomKey) => (
					<li key={roomKey}>
						<button
							type="button"
							data-testid={`join-${roomKey}`}
							onClick={() => {
								if (socket) {
									socket.emit(`join-room`, roomKey)
								} else {
									console.log(`socket is null`)
								}
							}}
						/>
					</li>
				))}
			</ul>
			<button
				type="button"
				data-testid="create-room"
				onClick={() => {
					if (socket) {
						socket.emit(`create-room`, `room-1`)
					} else {
						console.log(`socket is null`)
					}
				}}
			>
				Click me!
			</button>
		</main>
	)
}

function View(): JSX.Element {
	const myRoomKey = RTR.usePullSelector(
		RT.usersInRooms.states.roomKeyOfUser(`CLIENT-1-1`),
	)
	return myRoomKey ? <Room roomId={myRoomKey} /> : <Lobby />
}

export function BrowserGame(): JSX.Element | null {
	const socketId = AR.useO(myIdState)

	return socketId ? <View /> : null
}
