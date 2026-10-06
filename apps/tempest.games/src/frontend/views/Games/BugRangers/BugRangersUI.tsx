import type { MutableAtomToken } from "atom.io"
import { atom, findRelations, setState } from "atom.io"
import { useJSON, useO } from "atom.io/react"
import type { UserKey } from "atom.io/realtime"
import { ownersOfRooms } from "atom.io/realtime"
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
import { AnimatePresence, motion } from "motion/react"
import { type ReactElement, useContext } from "react"
import type { Socket } from "socket.io-client"

import type {
	GameState,
	PlayerActions,
} from "../../../../library/bug-rangers-game-state"
import {
	colorsChosenSelector,
	gameStateAtom,
	PLAYER_COLOR_DISPLAY_NAMES,
	PLAYER_COLORS,
	playerColorAtoms,
	playerRemainingCubesAtoms,
	playerRemainingTilesAtoms,
	playerTurnOrderAtom,
	playerTurnSelector,
	setupGroupsSelector,
	turnCanBeEndedSelector,
	turnInProgressAtom,
	turnNumberAtom,
} from "../../../../library/bug-rangers-game-state"
import { isAdminAtom } from "../../../../library/store"
import { usernameAtoms } from "../../../../library/username-state"
import * as userSvg from "../../../<svg>"
import { isMyTurnSelector } from "./bug-rangers-client-state"
import css from "./BugRangersUI.module.css"
import { cube, tile } from "./Icons"

const svg = { ...userSvg, cube, tile }
// These intrinsic namespaces describe Motion's stable HTML roots to Lasertag.
const section = { Animated: motion.section }
const figure = { Animated: motion.figure }
const span = { Animated: motion.span }
const h1 = { Animated: motion.h1 }

export function BugRangersUI(): ReactElement {
	const { myRoomKey } = useRealtimeRooms()
	const myUserKey = usePullAtom(myUserKeyAtom)
	return (
		<bug-rangers-ui className={css.class}>
			{myUserKey ? <UserInterior /> : null}
			{myUserKey && myRoomKey ? (
				<Interior myUserKey={myUserKey} />
			) : (
				<Exterior />
			)}
		</bug-rangers-ui>
	)
}

function Exterior(): ReactElement {
	const { roomSocket, allRoomKeysAtom } = useRealtimeRooms()
	const allRoomKeys = useJSON(allRoomKeysAtom)
	const gameRoomKey = allRoomKeys.find((key) => key.includes(`bug-rangers`))
	return (
		<room-exterior>
			<button
				type="button"
				disabled={gameRoomKey === undefined}
				onClick={() => {
					roomSocket.emit(`joinRoom`, allRoomKeys[0])
				}}
			>
				{gameRoomKey ? `Join Game` : `Waiting for Host`}
			</button>
		</room-exterior>
	)
}

function Interior({ myUserKey }: { myUserKey: UserKey }): ReactElement {
	const gameState = usePullAtom(gameStateAtom)
	const myRemainingTiles = usePullAtomFamilyMember(
		playerRemainingTilesAtoms,
		myUserKey,
	)
	const myRemainingCubes = usePullAtomFamilyMember(
		playerRemainingCubesAtoms,
		myUserKey,
	)
	const playerTurn = usePullSelector(playerTurnSelector)
	return (
		<>
			<RoomModule />
			{playerTurn ? <TurnBanner playerTurn={playerTurn} /> : null}
			{gameState === `playing` ? (
				<>
					<PlayerTurnControls />
					<game-counter data-kind="tiles">
						<svg.tile stroke="var(--fg)" strokeWidth={2} />
						<span>{myRemainingTiles}</span>
					</game-counter>
					<game-counter data-kind="cubes">
						<svg.cube stroke="var(--fg)" strokeWidth={2} />
						<span>{myRemainingCubes}</span>
					</game-counter>
				</>
			) : null}
		</>
	)
}

function UserInterior(): ReactElement | null {
	const isAdmin = usePullAtom(isAdminAtom)
	return isAdmin ? <Devtools /> : null
}

function RoomModule(): ReactElement {
	const { myMutualsAtom } = useRealtimeRooms()

	const gameState = usePullAtom(gameStateAtom)

	return (
		<room-module>
			<section.Animated layout>
				<GameSetupPhase isCurrentPhase={gameState === `setup`} />
				<GamePlayingPhase
					isCurrentPhase={gameState === `playing`}
					gameState={gameState}
					myMutualsAtom={myMutualsAtom}
				/>
			</section.Animated>
		</room-module>
	)
}

const showBugRangersDevtoolsAtom = atom<boolean>({
	key: `showBugRangersDevtools`,
	default: false,
})

function Devtools(): ReactElement {
	const showBugRangersDevtools = usePullAtom(showBugRangersDevtoolsAtom)
	const { myRoomKey } = useRealtimeRooms()

	return (
		<>
			<button
				type="button"
				data-css="devtools-toggle"
				onClick={() => {
					setState(showBugRangersDevtoolsAtom, (prev) => !prev)
				}}
			>
				{showBugRangersDevtools ? `hide` : `show`} devtools
			</button>
			{showBugRangersDevtools ? (
				<game-devtools>
					<h1>{myRoomKey ?? `null`}</h1>
					<RoomControls />
					{myRoomKey ? <DevtoolsInterior /> : null}
				</game-devtools>
			) : null}
		</>
	)
}

function DevtoolsInterior(): ReactElement {
	const gameState = usePullAtom(gameStateAtom)
	const turnNumber = usePullAtom(turnNumberAtom)
	const playerTurn = usePullSelector(playerTurnSelector)
	return (
		<>
			<span>
				{gameState === `setup` ? (
					`Setup`
				) : (
					<>
						<PlayerUsername userKey={playerTurn ?? `user::$_NONE_$`} />
						{` `}playing turn {turnNumber}
					</>
				)}
			</span>
			<GameControls />
		</>
	)
}

function PlayerUsername({ userKey }: { userKey: UserKey }): ReactElement {
	const username = usePullAtomFamilyMember(usernameAtoms, userKey)
	return <>{username}</>
}

function PlayerTurnControls(): ReactElement {
	const myUserKey = useO(myUserKeyAtom)
	const myColor = useO(playerColorAtoms, myUserKey as UserKey)
	const { socket } = useContext(RealtimeContext)
	const gameSocket = socket as Socket<{}, PlayerActions>
	const colorsChosen = useO(colorsChosenSelector)
	const isMyTurn = useO(isMyTurnSelector)
	const turnCanBeEnded = useO(turnCanBeEndedSelector)
	const turnInProgress = usePullAtom(turnInProgressAtom)
	return (
		<turn-controls>
			{myColor === null ? (
				PLAYER_COLORS.map((color, idx) => (
					<button
						data-css-color-choice
						disabled={colorsChosen.has(color) || !isMyTurn}
						key={idx}
						type="button"
						style={{ pointerEvents: `all`, background: color }}
						onClick={() => {
							gameSocket.emit(`chooseColor`, color)
						}}
					>
						{PLAYER_COLOR_DISPLAY_NAMES[color]}
					</button>
				))
			) : (
				<>
					<button
						type="button"
						disabled={!isMyTurn || turnInProgress === null}
						onClick={() => {
							setState(turnInProgressAtom, null)
							gameSocket.emit(`turnRestart`)
						}}
					>
						restart turn
					</button>
					<button
						type="button"
						disabled={!turnCanBeEnded || !isMyTurn}
						onClick={() => {
							setState(turnInProgressAtom, null)
							gameSocket.emit(`turnEnd`)
						}}
					>
						end turn
					</button>
				</>
			)}
		</turn-controls>
	)
}

function RoomControls(): ReactElement {
	const { roomSocket, allRoomKeysAtom, myRoomKey } = useRealtimeRooms()
	const bugRangersRoomKey = useJSON(allRoomKeysAtom).find((key) =>
		key.includes(`bug-rangers`),
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
						if (bugRangersRoomKey) {
							roomSocket?.emit(`joinRoom`, bugRangersRoomKey)
						} else {
							roomSocket?.emit(`createRoom`, `backend.worker.bug-rangers.bun`)
						}
					}}
				>
					{bugRangersRoomKey ? `Join ${bugRangersRoomKey}` : `Create room`}
				</button>
			)}
			{bugRangersRoomKey ? (
				<button
					type="button"
					onClick={() => {
						roomSocket?.emit(`deleteRoom`, bugRangersRoomKey)
					}}
				>
					Delete {bugRangersRoomKey}
				</button>
			) : null}
		</section>
	)
}
function GameControls(): ReactElement {
	const { socket } = useContext(RealtimeContext)
	const gameSocket = socket as Socket<{}, PlayerActions>
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
	const gameSocket = socket as Socket<{}, PlayerActions>
	const setupGroups = usePullSelector(setupGroupsSelector)
	return (
		<section.Animated
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
		</section.Animated>
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
		<section.Animated
			layout
			data-css="playing"
			data-css-current={isCurrentPhase || undefined}
		>
			<UserGroup
				groupName="Turn Order"
				dataCss="turn-order"
				userKeys={turnOrder}
			/>
		</section.Animated>
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
			<group-heading>{groupName}</group-heading>
			<group-members>
				{userKeys.map((userKey) => {
					return <User key={userKey} userKey={userKey} />
				})}
			</group-members>
		</section>
	)
}

function User({ userKey }: { userKey: UserKey }): ReactElement {
	const myUserKey = useO(myUserKeyAtom)
	const { myRoomKey } = useRealtimeRooms()
	const relations = findRelations(ownersOfRooms, myRoomKey ?? `room::`)
	const ownerKey = useO(relations.userKeyOfRoom)
	const username = usePullAtomFamilyMember(usernameAtoms, userKey)
	const color = usePullAtomFamilyMember(playerColorAtoms, userKey) ?? `#555`
	const currentTurn = useO(playerTurnSelector)
	return (
		<figure.Animated layoutId={userKey} data-css-user>
			{userKey === myUserKey ? (
				userKey === ownerKey ? (
					<svg.leaderMe color={color} />
				) : (
					<svg.me color={color} />
				)
			) : userKey === ownerKey ? (
				<svg.leaderYou color={color} />
			) : (
				<svg.you color={color} />
			)}
			{userKey === currentTurn ? <svg.current color={color} /> : null}
			<span>{username.slice(0, 3)}</span>
		</figure.Animated>
	)
}

function TurnBanner({ playerTurn }: { playerTurn: UserKey }): ReactElement {
	const username = usePullAtomFamilyMember(usernameAtoms, playerTurn)
	const playerColor = usePullAtomFamilyMember(playerColorAtoms, playerTurn)
	const myUserKey = useO(myUserKeyAtom)
	return (
		<turn-banner>
			<AnimatePresence mode="wait">
				<figure.Animated
					key={playerTurn}
					initial={{ x: `-1500%`, skewX: `-50deg`, width: `20vw` }}
					animate={{
						x: [`-1500%`, `2%`, `4%`, `1500%`],
						skewX: [`-50deg`, `-5deg`, `-5deg`, `-50deg`],
						width: [`20vw`, `90vw`, `90vw`, `10vw`],
					}}
					transition={{
						duration: 3,
						times: [0, 0.1, 0.77, 1],
						ease: [`circOut`, `linear`, `easeIn`],
					}}
				/>
			</AnimatePresence>
			<AnimatePresence mode="wait">
				<span.Animated
					data-css="top"
					style={{ backgroundColor: playerColor ?? `#555` }}
					key={playerTurn}
					initial={{ x: `-1500%`, skewX: `-50deg`, width: `20vw` }}
					animate={{
						x: [`-1500%`, `2%`, `4%`, `1500%`],
						skewX: [`-50deg`, `-5deg`, `-5deg`, `-50deg`],
						width: [`20vw`, `20vw`, `100vw`, `10vw`],
					}}
					transition={{
						duration: 3,
						times: [0, 0.1, 0.7, 1],
						ease: [`circOut`, `linear`, `easeIn`],
					}}
				/>
			</AnimatePresence>
			<AnimatePresence mode="wait">
				<span.Animated
					data-css="bottom"
					key={playerTurn}
					initial={{ x: `-1500%`, skewX: `-50deg`, width: `20vw` }}
					animate={{
						x: [`1500%`, `4%`, `2%`, `-1500%`],
						skewX: [`-50deg`, `-5deg`, `-5deg`, `-50deg`],
						width: [`20vw`, `20vw`, `100vw`, `10vw`],
					}}
					transition={{
						duration: 3,
						times: [0, 0.1, 0.7, 1],
						ease: [`circOut`, `linear`, `easeIn`],
					}}
				/>
			</AnimatePresence>
			<AnimatePresence mode="wait">
				<h1.Animated
					style={{ backgroundColor: playerColor ?? `#555` }}
					key={playerTurn}
					initial={{ x: `-1500%`, skewX: `-50deg`, width: `20vw` }}
					animate={{
						x: [`-1500%`, `5%`, `10%`, `1500%`],
						skewX: [`-50deg`, `-5deg`, `-5deg`, `-50deg`],
						width: [`20vw`, `80vw`, `80vw`, `10vw`],
					}}
					transition={{
						duration: 3,
						times: [0, 0.2, 0.75, 1],
						ease: [`circOut`, `linear`, `easeIn`],
					}}
				>
					{playerTurn === myUserKey ? `your turn` : `${username}'s turn`}
				</h1.Animated>
			</AnimatePresence>
		</turn-banner>
	)
}
