import type { MutableAtomToken } from "atom.io"
import { findRelations, setState } from "atom.io"
import { useJSON, useO } from "atom.io/react"
import { ownersOfRooms, type TypedSocket, type UserKey } from "atom.io/realtime"
import {
	RealtimeContext,
	usePullAtom,
	usePullAtomFamilyMember,
	usePullSelector,
	useRealtimeRooms,
} from "atom.io/realtime-react"
import type { UList } from "atom.io/transceivers/u-list"
import { motion } from "motion/react"
import { type ReactElement, type ReactNode, useContext } from "react"

import type {
	GameState,
	PlayerActions,
} from "../../../../library/bug-rangers-game-state"
import {
	gameStateAtom,
	playerTurnSelector,
	setupGroupsSelector,
	turnInProgressAtom,
	turnNumberAtom,
} from "../../../../library/bug-rangers-game-state"
import { usernameAtoms } from "../../../../library/username-state"
import scss from "./BugRangersUI.module.scss"

export function BugRangersUI(): ReactNode {
	const { myRoomKey, myMutualsAtom } = useRealtimeRooms()
	const turnInProgress = useO(turnInProgressAtom)
	const turnNumber = useO(turnNumberAtom)
	const playerTurn = useO(playerTurnSelector)
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
				<GameSetup />
				<GamePlaying gameState={gameState} myMutualsAtom={myMutualsAtom} />
				<GameControls />
			</article>
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
		</main>
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
		</section>
	)
}

function GameSetup(): ReactElement {
	const { socket } = useContext(RealtimeContext)
	const gameSocket = socket as unknown as TypedSocket<{}, PlayerActions>
	const setupGroups = usePullSelector(setupGroupsSelector)
	return (
		<main data-css="setup">
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
		</main>
	)
}

function GamePlaying({
	gameState,
	myMutualsAtom,
}: {
	gameState: GameState
	myMutualsAtom: MutableAtomToken<UList<UserKey>>
}): ReactElement {
	const myMutuals = useJSON(myMutualsAtom)
	return (
		<main data-css="playing">
			{gameState === `playing`
				? myMutuals.map((mutualUserKey) => {
						return <User key={mutualUserKey} userKey={mutualUserKey} />
					})
				: null}
		</main>
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
	userKeys: UserKey[]
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
	const { myRoomKey } = useRealtimeRooms()
	const relations = findRelations(ownersOfRooms, myRoomKey ?? `room::`)
	const ownerKey = useO(relations.userKeyOfRoom)
	const ownsMyRoom = ownerKey === userKey
	const username = usePullAtomFamilyMember(usernameAtoms, userKey)
	return (
		<motion.div
			layoutId={userKey}
			data-css-user
			data-css-owner={ownsMyRoom ? `👑` : undefined}
		>
			{username.slice(0, 1)}
		</motion.div>
	)
}
