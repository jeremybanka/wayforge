import { findInStore } from "atom.io/internal"
import * as AR from "atom.io/react"
import { myIdState } from "atom.io/realtime-client"
import * as RTR from "atom.io/realtime-react"
import * as RTS from "atom.io/realtime-server"
import * as React from "react"
import { letterAtoms } from "./game-store"

function Room({ roomId }: { roomId: string }): JSX.Element {
	console.log(`rendering room ${roomId}`)
	const store = React.useContext(AR.StoreContext)
	const letter0State = findInStore(letterAtoms, 0, store)
	RTR.usePull(letterAtoms(0))
	const letter0 = AR.useO(letter0State)
	return (
		<main>
			<h1>{roomId}</h1>
			<p>{letter0}</p>
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
					<li key={roomKey} data-testid={roomKey}>
						{roomKey}
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

function App(props: { socketId: string }): JSX.Element {
	const store = React.useContext(AR.StoreContext)
	const { socket } = React.useContext(RTR.RealtimeContext)

	const myRelatedUserState = findInStore(
		RTS.usersOfSockets.core.findRelatedKeysState,
		props.socketId,
		store,
	)
	RTR.usePullMutableFamilyMember(myRelatedUserState)
	const myUserKey = AR.useO(
		RTS.usersOfSockets.states.userKeyOfSocket,
		props.socketId,
	)

	const myRelatedRoomKeysState = findInStore(
		RTS.usersInRooms.core.findRelatedKeysState,
		myUserKey ?? ``,
		store,
	)
	RTR.usePullMutableFamilyMember(myRelatedRoomKeysState)
	socket?.onAny((event, ...args) => {
		console.log(event, args)
	})

	const myRoomKey = AR.useO(RTS.usersInRooms.states.roomKeyOfUser, myUserKey)

	return myRoomKey ? <Room roomId={myRoomKey} /> : <Lobby />
}

export function BrowserGame(): JSX.Element | null {
	const mySocketId = AR.useO(myIdState)
	return mySocketId ? <App socketId={mySocketId} /> : null
}
