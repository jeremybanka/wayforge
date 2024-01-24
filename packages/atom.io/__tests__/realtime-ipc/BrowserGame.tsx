import { findInStore } from "atom.io/internal"
import * as AR from "atom.io/react"
import { myIdState } from "atom.io/realtime-client"
import * as RTR from "atom.io/realtime-react"
import * as RTS from "atom.io/realtime-server"
import * as React from "react"
import { letterAtoms } from "./game-store"

function Room({ roomId }: { roomId: string }): JSX.Element {
	const store = React.useContext(AR.StoreContext)
	const letter0State = findInStore(letterAtoms, 0, store)
	RTR.usePullAtom(letterAtoms(0))
	const letter0 = AR.useO(letter0State)
	return (
		<main data-testid={roomId}>
			<h1>{roomId}</h1>
			<p data-testid={letter0}>{letter0}</p>
		</main>
	)
}

function Lobby(): JSX.Element {
	const { socket } = React.useContext(RTR.RealtimeContext)
	RTR.usePullMutable(RTS.roomIndex)
	const roomKeys = AR.useJSON(RTS.roomIndex)
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

function B(props: { myUserKey: string }): JSX.Element {
	const myRoomKey = RTR.usePullSelectorFamilyMember(
		RTS.usersInRooms.states.roomKeyOfUser,
		props.myUserKey,
	)

	return myRoomKey ? <Room roomId={myRoomKey} /> : <Lobby />
}

export function A(props: { mySocketKey: string }): JSX.Element | null {
	const myUserKey = RTR.usePullSelectorFamilyMember(
		RTS.usersOfSockets.states.userKeyOfSocket,
		props.mySocketKey,
	)
	return myUserKey ? <B myUserKey={myUserKey} /> : null
}

export function BrowserGame(): JSX.Element | null {
	const mySocketKey = AR.useO(myIdState)
	return mySocketKey ? <A mySocketKey={mySocketKey} /> : null
}
