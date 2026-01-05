import { atom, setState } from "atom.io"
import { useJSON, useO } from "atom.io/react"
import type { RoomKey } from "atom.io/realtime"
import { myUserKeyAtom } from "atom.io/realtime-client"
import {
	RealtimeContext,
	usePullAtom,
	useRealtimeRooms,
} from "atom.io/realtime-react"
import { type ReactElement, useContext } from "react"

import { isAdminAtom } from "../../../library/store"
import scss from "./Hearts.module.scss"
import { MyDomain } from "./Hearts/my-domain/MyDomain"
import { EnemyDomains } from "./Hearts/other-players/EnemyDomains"
import { Public } from "./Hearts/public/Public"

export function Hearts(): ReactElement | null {
	const { myRoomKey } = useRealtimeRooms()
	const myUserKey = usePullAtom(myUserKeyAtom)
	return (
		<div className={scss[`class`]}>
			{myRoomKey ? <HeartsInterior roomKey={myRoomKey} /> : <HeartsExterior />}
			{myUserKey ? <UserInterior /> : null}
		</div>
	)
}

export function HeartsExterior(): null {
	return null
}

export type HeartsInteriorProps = {
	roomKey: RoomKey
}
export function HeartsInterior({ roomKey }: HeartsInteriorProps): ReactElement {
	return (
		<>
			<section data-css="enemy-domains">
				<EnemyDomains />
			</section>
			<section data-css="public">
				<Public roomKey={roomKey} />
			</section>
			<section data-css="my-domain">
				<MyDomain />
			</section>
		</>
	)
}

function UserInterior(): ReactElement | null {
	const isAdmin = usePullAtom(isAdminAtom)
	return isAdmin ? <Devtools /> : null
}

const showHeartsDevtoolsAtom = atom<boolean>({
	key: `showHeartsDevtools`,
	default: false,
})

function Devtools(): ReactElement {
	const showBugRangersDevtools = useO(showHeartsDevtoolsAtom)
	const { myRoomKey } = useRealtimeRooms()

	return (
		<>
			<button
				type="button"
				data-css="devtools-toggle"
				onClick={() => {
					setState(showHeartsDevtoolsAtom, (prev) => !prev)
				}}
			>
				{showBugRangersDevtools ? `hide` : `show`} devtools
			</button>
			{showBugRangersDevtools ? (
				<article data-css="devtools">
					<h1>{myRoomKey ?? `null`}</h1>
					<RoomControls />
					{myRoomKey ? <DevtoolsInterior /> : null}
				</article>
			) : null}
		</>
	)
}

function DevtoolsInterior(): ReactElement {
	const { socket } = useContext(RealtimeContext)
	// const gameSocket = socket as Socket<{}, PlayerActions>
	// const gameState = usePullAtom(gameStateAtom)
	// const turnNumber = usePullAtom(turnNumberAtom)
	// const playerTurn = usePullSelector(playerTurnSelector)
	return (
		<>
			{/* <span>
				{gameState === `setup` ? (
					`Setup`
				) : (
					<>
						<PlayerUsername userKey={playerTurn ?? `user::$_NONE_$`} />
						{` `}playing turn {turnNumber}
					</>
				)}
			</span> */}
			<section>
				<button
					type="button"
					onClick={() => {
						// gameSocket.emit(`startGame`)
					}}
				>
					start game
				</button>
				<button
					type="button"
					onClick={() => {
						socket?.emit(`RESET_GAME`)
					}}
				>
					reset game
				</button>
			</section>
		</>
	)
}
function RoomControls(): ReactElement {
	const { roomSocket, allRoomKeysAtom, myRoomKey } = useRealtimeRooms()
	const heartsRoomKey = useJSON(allRoomKeysAtom).find((key) =>
		key.includes(`hearts`),
	)
	return (
		<section data-css="room-controls">
			{myRoomKey ? (
				<button
					type="button"
					onClick={() => {
						roomSocket?.emit(`leaveRoom`)
					}}
				>
					Leave {myRoomKey}
				</button>
			) : (
				<button
					type="button"
					onClick={() => {
						if (heartsRoomKey) {
							roomSocket?.emit(`joinRoom`, heartsRoomKey)
						} else {
							roomSocket?.emit(`createRoom`, `backend.worker.hearts.bun`)
						}
					}}
				>
					{heartsRoomKey ? `Join ${heartsRoomKey}` : `Create room`}
				</button>
			)}
			{heartsRoomKey ? (
				<button
					type="button"
					onClick={() => {
						roomSocket?.emit(`deleteRoom`, heartsRoomKey)
					}}
				>
					Delete {heartsRoomKey}
				</button>
			) : null}
		</section>
	)
}
