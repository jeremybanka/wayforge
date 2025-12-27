import type { MutableAtomToken } from "atom.io"
import { findRelations, setState } from "atom.io"
import { useJSON, useO } from "atom.io/react"
import { ownersOfRooms, type TypedSocket, type UserKey } from "atom.io/realtime"
import { myUserKeyAtom } from "atom.io/realtime-client"
import {
	RealtimeContext,
	usePullAtom,
	usePullAtomFamilyMember,
	usePullMutable,
	usePullSelector,
	useRealtimeRooms,
} from "atom.io/realtime-react"
import type { UList } from "atom.io/transceivers/u-list"
import { motion } from "motion/react"
import { type ReactElement, type ReactNode, useContext } from "react"

import Current from "../../../../../public/current.svg"
import LeaderMe from "../../../../../public/leader-me.svg"
import LeaderYou from "../../../../../public/leader-you.svg"
import Me from "../../../../../public/me.svg"
import You from "../../../../../public/you.svg"
import type {
	GameState,
	PlayerActions,
} from "../../../../library/bug-rangers-game-state"
import {
	gameStateAtom,
	PLAYER_COLOR_DISPLAY_NAMES,
	PLAYER_COLORS,
	playerColorAtoms,
	playerTurnOrderAtom,
	playerTurnSelector,
	setupGroupsSelector,
	turnInProgressAtom,
	turnNumberAtom,
} from "../../../../library/bug-rangers-game-state"
import { usernameAtoms } from "../../../../library/username-state"
import scss from "./BugRangersUI.module.scss"

export function BugRangersUI(): ReactNode {
	const { myRoomKey } = useRealtimeRooms()

	return myRoomKey ? <Interior /> : <Exterior />
}

export function Exterior(): ReactNode {
	const { myRoomKey } = useRealtimeRooms()
	return (
		<main className={scss[`class`]}>
			<article data-css="room-module">
				<header>
					<h1>{myRoomKey}</h1>
				</header>

				<RoomControls />
			</article>
		</main>
	)
}

export function Interior(): ReactNode {
	const { myRoomKey, myMutualsAtom } = useRealtimeRooms()
	const turnNumber = useO(turnNumberAtom)
	const playerTurn = usePullSelector(playerTurnSelector)
	const gameState = usePullAtom(gameStateAtom)
	return (
		<main className={scss[`class`]}>
			<article data-css="room-module">
				<header>
					<h1>{myRoomKey}</h1>
					<span>Turn {turnNumber}</span>
				</header>
				<div>player turn: {playerTurn ?? `null`}</div>
				<div>game state: {gameState}</div>
				<RoomControls />
				<motion.main layout>
					<GameSetupPhase isCurrentPhase={gameState === `setup`} />
					<GamePlayingPhase
						isCurrentPhase={gameState === `playing`}
						gameState={gameState}
						myMutualsAtom={myMutualsAtom}
					/>
				</motion.main>
				<GameControls />
			</article>
			<article>
				<PlayerTurnControls />
			</article>
		</main>
	)
}

function PlayerTurnControls(): ReactElement {
	const turnInProgress = useO(turnInProgressAtom)
	const myUserKey = useO(myUserKeyAtom)
	const myColor = useO(playerColorAtoms, myUserKey as UserKey)
	const { socket } = useContext(RealtimeContext)
	const gameSocket = socket as unknown as TypedSocket<{}, PlayerActions>
	return (
		<>
			{myColor === null ? (
				PLAYER_COLORS.map((color, idx) => (
					<button
						key={idx}
						type="button"
						style={{ pointerEvents: `all` }}
						onClick={() => {
							gameSocket.emit(`chooseColor`, color)
						}}
					>
						{PLAYER_COLOR_DISPLAY_NAMES[color]}
					</button>
				))
			) : (
				<button
					type="button"
					disabled={!turnInProgress}
					style={{ pointerEvents: `all` }}
					onClick={() => {
						setState(turnInProgressAtom, null)
					}}
				>
					end turn
				</button>
			)}
		</>
	)
}

function RoomControls(): ReactElement {
	const { roomSocket, allRoomKeysAtom, myRoomKey } = useRealtimeRooms()
	const allRoomKeys = useJSON(allRoomKeysAtom)
	return (
		<section>
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
						if (allRoomKeys.length === 0) {
							roomSocket?.emit(`createRoom`, `backend.worker.bug-rangers.bun`)
						} else {
							roomSocket?.emit(`joinRoom`, allRoomKeys[0])
						}
					}}
				>
					{allRoomKeys.length === 0 ? `Create room` : `Join ${allRoomKeys[0]}`}
				</button>
			)}
			{allRoomKeys.length === 0 ? null : (
				<button
					type="button"
					onClick={() => {
						roomSocket?.emit(`deleteRoom`, allRoomKeys[0])
					}}
				>
					Delete {allRoomKeys[0]}
				</button>
			)}
		</section>
	)
}
function GameControls(): ReactElement {
	const { socket } = useContext(RealtimeContext)
	const gameSocket = socket as unknown as TypedSocket<{}, PlayerActions>
	return (
		<section>
			<button
				type="button"
				onClick={() => {
					gameSocket.emit(`startGame`)
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
	)
}

function GameSetupPhase({
	isCurrentPhase,
}: {
	isCurrentPhase: boolean
}): ReactElement {
	const { socket } = useContext(RealtimeContext)
	const gameSocket = socket as unknown as TypedSocket<{}, PlayerActions>
	const setupGroups = usePullSelector(setupGroupsSelector)
	return (
		<motion.section
			layout
			data-css="setup"
			data-css-current={isCurrentPhase || undefined}
		>
			<UserGroup
				groupName="Not Ready"
				dataCss="not-ready"
				userKeys={setupGroups.notReady}
			/>
			<UserGroup
				groupName="Does not Want First"
				dataCss="ready-does-not-want-first"
				userKeys={setupGroups.readyDoesNotWantFirst}
				onClick={() => {
					gameSocket?.emit(`wantNotFirst`)
				}}
			/>
			<UserGroup
				groupName="Wants First"
				dataCss="ready-wants-first"
				userKeys={setupGroups.readyWantsFirst}
				onClick={() => {
					gameSocket?.emit(`wantFirst`)
				}}
			/>
		</motion.section>
	)
}

function GamePlayingPhase({
	isCurrentPhase,
}: {
	isCurrentPhase: boolean
	gameState: GameState
	myMutualsAtom: MutableAtomToken<UList<UserKey>>
}): ReactElement {
	const turnOrder = usePullMutable(playerTurnOrderAtom)
	return (
		<motion.section
			layout
			data-css="playing"
			data-css-current={isCurrentPhase || undefined}
		>
			<UserGroup
				groupName="Turn Order"
				dataCss="turn-order"
				userKeys={turnOrder}
			/>
		</motion.section>
	)
}

function UserGroup({
	groupName,
	dataCss,
	userKeys,
	onClick,
}: {
	groupName: string
	dataCss: string
	userKeys: readonly UserKey[]
	onClick?: () => void
}): ReactElement {
	return (
		<section data-css={dataCss}>
			<button type="button" onClick={onClick} disabled={!onClick} />
			<header>{groupName}</header>
			<main>
				{userKeys.map((userKey) => {
					return <User key={userKey} userKey={userKey} />
				})}
			</main>
		</section>
	)
}

function User({ userKey }: { userKey: UserKey }): ReactElement {
	const myUserKey = useO(myUserKeyAtom)
	const { myRoomKey } = useRealtimeRooms()
	const relations = findRelations(ownersOfRooms, myRoomKey ?? `room::`)
	const ownerKey = useO(relations.userKeyOfRoom)
	const username = usePullAtomFamilyMember(usernameAtoms, userKey)
	const color = usePullAtomFamilyMember(playerColorAtoms, userKey)
	const currentTurn = useO(playerTurnSelector)
	return (
		<motion.div layoutId={userKey} data-css-user style={{ background: color }}>
			{userKey === myUserKey ? (
				userKey === ownerKey ? (
					<img src={LeaderMe} alt="it's you!" />
				) : (
					<img src={Me} alt="it's you!" />
				)
			) : userKey === ownerKey ? (
				<img src={LeaderYou} alt={`it's ${username}!`} />
			) : (
				<img src={You} alt={`it's ${username}!`} />
			)}
			{userKey === currentTurn ? (
				<motion.img
					layoutId="current_turn"
					src={Current}
					alt={`it's ${userKey === myUserKey ? `your` : `their`} turn!`}
				/>
			) : null}
			<span>{username.slice(0, 2)}</span>
		</motion.div>
	)
}
