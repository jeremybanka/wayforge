import type { UserKey } from "@atom.io/realtime"
import { ownersOfRooms } from "@atom.io/realtime"
import { myUserKeyAtom } from "@atom.io/realtime/client"
import type { Children } from "@atom.io/spa"
import { onCleanup, onMount, useGetter } from "@atom.io/spa"
import { atom, findRelations, setState } from "atom.io"
import { animate } from "motion"
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
import { useLayoutMotion } from "../../../services/layout-motion"
import {
	usePullAtom,
	usePullAtomFamilyMember,
	usePullMutable,
	usePullSelector,
	useRealtimeRooms,
} from "../../../services/realtime-hooks"
import { realtimeSocket as socket } from "../../../services/socket-auth-service"
import { useLocalState } from "../../../services/spa-state"
import { isMyTurnSelector } from "./bug-rangers-client-state"
import css from "./BugRangersUI.module.css"
import { cube, tile } from "./Icons"

const svg = { ...userSvg, cube, tile }
export function BugRangersUI(): Children {
	const { myRoomKey } = useRealtimeRooms()
	const myUserKey = usePullAtom(myUserKeyAtom)
	return (
		<bug-rangers-ui className={css.class}>
			{myUserKey() ? <UserInterior /> : null}
			{myUserKey() && myRoomKey() ? (
				<Interior
					key={`${myUserKey()}:${myRoomKey()}`}
					myUserKey={myUserKey()!}
				/>
			) : (
				<Exterior />
			)}
		</bug-rangers-ui>
	)
}

function Exterior(): Children {
	const { roomSocket, allRoomKeys: allRooms } = useRealtimeRooms()
	const allRoomKeys = () => allRooms()
	const gameRoomKey = () =>
		allRoomKeys().find((key) => key.includes(`bug-rangers`))
	return (
		<room-exterior>
			<button
				type="button"
				disabled={gameRoomKey() === undefined}
				onClick={() => {
					roomSocket.emit(`joinRoom`, allRoomKeys()[0])
				}}
			>
				{gameRoomKey() ? `Join Game` : `Waiting for Host`}
			</button>
		</room-exterior>
	)
}

function Interior(props: { myUserKey: UserKey }): Children {
	const gameState = usePullAtom(gameStateAtom)
	const myRemainingTiles = usePullAtomFamilyMember(
		playerRemainingTilesAtoms,
		props.myUserKey,
	)
	const myRemainingCubes = usePullAtomFamilyMember(
		playerRemainingCubesAtoms,
		props.myUserKey,
	)
	const playerTurn = usePullSelector(playerTurnSelector)
	return (
		<>
			<RoomModule />
			{playerTurn() ? (
				<TurnBanner key={playerTurn()!} playerTurn={playerTurn()!} />
			) : null}
			{gameState() === `playing` ? (
				<>
					<PlayerTurnControls
						key={props.myUserKey}
						myUserKey={props.myUserKey}
					/>
					<game-counter data-kind="tiles">
						<svg.tile stroke="var(--fg)" strokeWidth={2} />
						<span>{myRemainingTiles()}</span>
					</game-counter>
					<game-counter data-kind="cubes">
						<svg.cube stroke="var(--fg)" strokeWidth={2} />
						<span>{myRemainingCubes()}</span>
					</game-counter>
				</>
			) : null}
		</>
	)
}

function UserInterior(): Children | null {
	const isAdmin = usePullAtom(isAdminAtom)
	return <>{isAdmin() ? <Devtools /> : null}</>
}

function RoomModule(): Children {
	const layout = useLayoutMotion()
	useRealtimeRooms()

	const gameState = usePullAtom(gameStateAtom)

	return (
		<room-module>
			<section ref={layout}>
				<GameSetupPhase isCurrentPhase={gameState() === `setup`} />
				<GamePlayingPhase
					isCurrentPhase={gameState() === `playing`}
					gameState={gameState()}
				/>
			</section>
		</room-module>
	)
}

const showBugRangersDevtoolsAtom = atom<boolean>({
	key: `showBugRangersDevtools`,
	default: false,
})

function Devtools(): Children {
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
				{showBugRangersDevtools() ? `hide` : `show`} devtools
			</button>
			{showBugRangersDevtools() ? (
				<game-devtools>
					<h1>{myRoomKey() ?? `null`}</h1>
					<RoomControls />
					{myRoomKey() ? <DevtoolsInterior /> : null}
				</game-devtools>
			) : null}
		</>
	)
}

function DevtoolsInterior(): Children {
	const gameState = usePullAtom(gameStateAtom)
	const turnNumber = usePullAtom(turnNumberAtom)
	const playerTurn = usePullSelector(playerTurnSelector)
	return (
		<>
			<span>
				{gameState() === `setup` ? (
					`Setup`
				) : (
					<>
						<PlayerUsername
							key={playerTurn() ?? `user::$_NONE_$`}
							userKey={playerTurn() ?? `user::$_NONE_$`}
						/>
						{` `}playing turn {turnNumber()}
					</>
				)}
			</span>
			<GameControls />
		</>
	)
}

function PlayerUsername(props: { userKey: UserKey }): Children {
	const username = usePullAtomFamilyMember(usernameAtoms, props.userKey)
	return <>{username()}</>
}

function PlayerTurnControls(props: { myUserKey: UserKey }): Children {
	const myColor = useGetter(playerColorAtoms, props.myUserKey)
	const gameSocket = socket as Socket<{}, PlayerActions>
	const colorsChosen = useGetter(colorsChosenSelector)
	const isMyTurn = useGetter(isMyTurnSelector)
	const turnCanBeEnded = useGetter(turnCanBeEndedSelector)
	const turnInProgress = usePullAtom(turnInProgressAtom)
	return (
		<turn-controls>
			{myColor() === null ? (
				PLAYER_COLORS.map((color, idx) => (
					<button
						data-css-color-choice
						disabled={colorsChosen().has(color) || !isMyTurn()}
						key={idx}
						type="button"
						style={`pointer-events: all; background: ${color}`}
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
						disabled={!isMyTurn() || turnInProgress() === null}
						onClick={() => {
							setState(turnInProgressAtom, null)
							gameSocket.emit(`turnRestart`)
						}}
					>
						restart turn
					</button>
					<button
						type="button"
						disabled={!turnCanBeEnded() || !isMyTurn()}
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

function RoomControls(): Children {
	const { roomSocket, allRoomKeys: allRooms, myRoomKey } = useRealtimeRooms()
	const bugRangersRoomKey = () =>
		allRooms().find((key) => key.includes(`bug-rangers`))
	return (
		<section data-css="room-controls">
			{myRoomKey() ? (
				<button
					type="button"
					onClick={() => {
						roomSocket?.emit(`leaveRoom`)
					}}
				>
					Leave {myRoomKey()}
				</button>
			) : (
				<button
					type="button"
					onClick={() => {
						if (bugRangersRoomKey()) {
							roomSocket?.emit(`joinRoom`, bugRangersRoomKey()!)
						} else {
							roomSocket?.emit(`createRoom`, `backend.worker.bug-rangers.bun`)
						}
					}}
				>
					{bugRangersRoomKey() ? `Join ${bugRangersRoomKey()}` : `Create room`}
				</button>
			)}
			{bugRangersRoomKey() ? (
				<button
					type="button"
					onClick={() => {
						roomSocket?.emit(`deleteRoom`, bugRangersRoomKey()!)
					}}
				>
					Delete {bugRangersRoomKey()}
				</button>
			) : null}
		</section>
	)
}
function GameControls(): Children {
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

function GameSetupPhase(props: { isCurrentPhase: boolean }): Children {
	const gameSocket = socket as Socket<{}, PlayerActions>
	const setupGroups = usePullSelector(setupGroupsSelector)
	const layout = useLayoutMotion()
	return (
		<section
			ref={layout}
			data-css="setup"
			data-css-current={props.isCurrentPhase || undefined}
		>
			<UserGroup
				groupName="Not Ready"
				dataCss="not-ready"
				userKeys={setupGroups().notReady}
			/>
			<UserGroup
				groupName="Does not Want First"
				dataCss="ready-does-not-want-first"
				userKeys={setupGroups().readyDoesNotWantFirst}
				onClick={() => {
					gameSocket?.emit(`wantNotFirst`)
				}}
			/>
			<UserGroup
				groupName="Wants First"
				dataCss="ready-wants-first"
				userKeys={setupGroups().readyWantsFirst}
				onClick={() => {
					gameSocket?.emit(`wantFirst`)
				}}
			/>
		</section>
	)
}

function GamePlayingPhase(props: {
	isCurrentPhase: boolean
	gameState: GameState
}): Children {
	const turnOrder = usePullMutable(playerTurnOrderAtom)
	const layout = useLayoutMotion()
	return (
		<section
			ref={layout}
			data-css="playing"
			data-css-current={props.isCurrentPhase || undefined}
		>
			<UserGroup
				groupName="Turn Order"
				dataCss="turn-order"
				userKeys={Array.from(turnOrder())}
			/>
		</section>
	)
}

function UserGroup(props: {
	groupName: string
	dataCss: string
	userKeys: readonly UserKey[]
	onClick?: () => void
}): Children {
	return (
		<section data-css={props.dataCss}>
			<button type="button" onClick={props.onClick} disabled={!props.onClick} />
			<group-heading>{props.groupName}</group-heading>
			<group-members>
				{props.userKeys.map((userKey) => {
					return <User key={userKey} userKey={userKey} />
				})}
			</group-members>
		</section>
	)
}

function User(props: { userKey: UserKey }): Children {
	const layout = useLayoutMotion(props.userKey)
	const myUserKey = useGetter(myUserKeyAtom)
	const { myRoomKey } = useRealtimeRooms()
	const relations = findRelations(ownersOfRooms, myRoomKey() ?? `room::`)
	const ownerKey = useGetter(relations.userKeyOfRoom)
	const username = usePullAtomFamilyMember(usernameAtoms, props.userKey)
	const color = usePullAtomFamilyMember(playerColorAtoms, props.userKey)
	const currentTurn = useGetter(playerTurnSelector)
	return (
		<figure ref={layout} data-css-user>
			{props.userKey === myUserKey() ? (
				props.userKey === ownerKey() ? (
					<svg.leaderMe color={color() ?? `#555`} />
				) : (
					<svg.me color={color() ?? `#555`} />
				)
			) : props.userKey === ownerKey() ? (
				<svg.leaderYou color={color() ?? `#555`} />
			) : (
				<svg.you color={color() ?? `#555`} />
			)}
			{props.userKey === currentTurn() ? (
				<svg.current color={color() ?? `#555`} />
			) : null}
			<span>{username().slice(0, 3)}</span>
		</figure>
	)
}

function TurnBanner(props: { playerTurn: UserKey }): Children {
	const username = usePullAtomFamilyMember(usernameAtoms, props.playerTurn)
	const playerColor = usePullAtomFamilyMember(playerColorAtoms, props.playerTurn)
	const myUserKey = useGetter(myUserKeyAtom)
	const [visible, setVisible] = useLocalState(true)
	let banner: HTMLElement | null = null
	onMount(() => {
		const timeout = setTimeout(() => {
			setVisible(false)
		}, 3000)
		onCleanup(() => {
			clearTimeout(timeout)
		})
		if (window.matchMedia(`(prefers-reduced-motion: reduce)`).matches) return
		const elements = Array.from(banner!.children)
		const widths = [
			[`20vw`, `90vw`, `90vw`, `10vw`],
			[`20vw`, `20vw`, `100vw`, `10vw`],
			[`20vw`, `20vw`, `100vw`, `10vw`],
			[`20vw`, `80vw`, `80vw`, `10vw`],
		]
		const animations = elements.map((element, index) =>
			animate(
				element,
				{
					x:
						index === 3
							? [`-1500%`, `5%`, `10%`, `1500%`]
							: index === 2
								? [`1500%`, `4%`, `2%`, `-1500%`]
								: [`-1500%`, `2%`, `4%`, `1500%`],
					skewX: [`-50deg`, `-5deg`, `-5deg`, `-50deg`],
					width: widths[index],
				},
				{
					duration: 3,
					times:
						index === 0
							? [0, 0.1, 0.77, 1]
							: index === 3
								? [0, 0.2, 0.75, 1]
								: [0, 0.1, 0.7, 1],
					ease: [`circOut`, `linear`, `easeIn`],
				},
			),
		)
		onCleanup(() => {
			animations.forEach((animation) => {
				animation.stop()
			})
		})
	})

	return (
		<>
			{visible() ? (
				<turn-banner
					ref={(element) => {
						banner = element
					}}
				>
					<figure />

					<span
						data-css="top"
						style={`background-color: ${playerColor() ?? `#555`}`}
					/>

					<span data-css="bottom" />

					<h1 style={`background-color: ${playerColor() ?? `#555`}`}>
						{props.playerTurn === myUserKey()
							? `your turn`
							: `${username()}'s turn`}
					</h1>
				</turn-banner>
			) : null}
		</>
	)
}
