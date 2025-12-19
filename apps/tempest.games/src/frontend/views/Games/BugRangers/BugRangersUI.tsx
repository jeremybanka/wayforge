import type { MutableAtomToken } from "atom.io"
import { setState } from "atom.io"
import { useJSON, useO } from "atom.io/react"
import type { UserKey } from "atom.io/realtime"
import { myRoomKeyAtom } from "atom.io/realtime-client"
import {
	usePullAtom,
	usePullAtomFamilyMember,
	useRealtimeRooms,
} from "atom.io/realtime-react"
import type { UList } from "atom.io/transceivers/u-list"
import { motion } from "motion/react"
import type { ReactElement, ReactNode } from "react"

import type { GameState } from "../../../../library/bug-rangers-game-state"
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
	const { myRoomKey, myMutualsAtom } = useRealtimeRooms(userKey)
	usePullAtom(myRoomKeyAtom)
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
				<GameSetup />
				<GamePlaying gameState={gameState} myMutualsAtom={myMutualsAtom} />
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

function GameSetup(): ReactElement {
	const setupGroups = useO(setupGroupsSelector)
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
