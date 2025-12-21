import type { MutableAtomToken } from "atom.io"
import { setState } from "atom.io"
import { useJSON, useO } from "atom.io/react"
import type { TypedSocket, UserKey } from "atom.io/realtime"
import { myRoomKeyAtom } from "atom.io/realtime-client"
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
import type { GameProps } from "../../Game"
import scss from "./BugRangersUI.module.scss"

export function BugRangersUI({ userKey }: GameProps): ReactNode {
	const { myRoomKey, myMutualsAtom, socket, allRoomKeysAtom } =
		useRealtimeRooms(userKey)
	usePullAtom(myRoomKeyAtom)
	const turnInProgress = useO(turnInProgressAtom)
	const turnNumber = useO(turnNumberAtom)
	const playerTurn = useO(playerTurnSelector)
	const gameState = usePullAtom(gameStateAtom)
	const allRoomKeys = useJSON(allRoomKeysAtom)

	return (
		<main className={scss[`class`]}>
			<article data-css="room-module">
				<header>
					<h1>{myRoomKey}</h1>
					<span>Turn {turnNumber}</span>
				</header>
				<div>player turn: {playerTurn ?? `null`}</div>
				<div>game state: {gameState}</div>
				<button
					type="button"
					onClick={() => {
						if (allRoomKeys.length === 0) {
							socket?.emit(`createRoom`, `backend.worker.bug-rangers.bun`)
						} else {
							socket?.emit(`joinRoom`, allRoomKeys[0])
						}
					}}
				>
					{allRoomKeys.length === 0 ? `Create room` : `Join ${allRoomKeys[0]}`}
				</button>
				<GameSetup />
				<GamePlaying gameState={gameState} myMutualsAtom={myMutualsAtom} />
				<Controls />
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

function Controls(): ReactElement {
	const { socket } = useContext(RealtimeContext)
	const gameSocket = socket as unknown as TypedSocket<{}, PlayerActions>
	return (
		<div>
			<button
				type="button"
				onClick={() => {
					gameSocket.emit(`wantFirst`)
				}}
			>
				want first
			</button>
			<button
				type="button"
				onClick={() => {
					gameSocket.emit(`wantNotFirst`)
				}}
			>
				want not first
			</button>
			<button
				type="button"
				onClick={() => {
					gameSocket.emit(`startGame`)
				}}
			>
				start game
			</button>
		</div>
	)
}

function GameSetup(): ReactElement {
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
			/>
			<UserGroup
				groupName="Wants First"
				dataCss="ready-wants-first"
				userKeys={setupGroups.readyWantsFirst}
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
}: {
	groupName: string
	dataCss: string
	userKeys: UserKey[]
}): ReactElement {
	return (
		<section data-css={dataCss}>
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
	const username = usePullAtomFamilyMember(usernameAtoms, userKey)
	return (
		<motion.div layoutId={userKey} data-css="user">
			{username.slice(0, 1)}
		</motion.div>
	)
}
