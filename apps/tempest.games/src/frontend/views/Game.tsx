import type { ViewOf } from "atom.io"
import { getInternalRelations, mutableAtomFamily, runTransaction } from "atom.io"
import { toEntries } from "atom.io/json"
import { useJSON, useO } from "atom.io/react"
import type { UserKey } from "atom.io/realtime"
import { roomKeysAtom, usersInRooms } from "atom.io/realtime"
import {
	usePullAtom,
	usePullMutable,
	usePullMutableAtomFamilyMember,
	useRealtimeRooms,
	useSyncContinuity,
} from "atom.io/realtime-react"
import { UList } from "atom.io/transceivers/u-list"
import * as React from "react"

import type { ActualWorkerName } from "../../backend.worker"
import {
	countAtom,
	countContinuity,
	cpuCountAtom,
	incrementTX,
} from "../../library/store"
import { Anchor } from "../Anchor"
import { type Route, ROUTES } from "../services/router-service"
import { authAtom } from "../services/socket-auth-service"
import scss from "./Game.module.scss"
import { BugRangers } from "./Games/BugRangers"

export type Tail<T extends any[]> = T extends [any, ...infer Rest] ? Rest : never

export type GameRoute = Extract<Route, [`game`, ...any]>

export type GameIndexProps = {
	route: ViewOf<GameRoute>
}

export function GameView({
	route: [, gameId],
}: GameIndexProps): React.ReactNode {
	return (
		<article className={scss[`class`]}>
			{gameId ? <Game gameId={gameId} /> : <GameIndex />}
		</article>
	)
}

export function GameIndex(): React.ReactNode {
	return (
		<nav>
			{GAMES.map((gameId) => (
				<Anchor key={gameId} href={`/game/${gameId}`}>
					{gameId}
				</Anchor>
			))}
		</nav>
	)
}

const GAMES = toEntries(ROUTES[1].game[1]).map(([gameId]) => gameId)
type GameId = (typeof GAMES)[number]
export type GameProps = { gameId: GameId }
export function Game({ gameId }: GameProps): React.ReactNode {
	switch (gameId) {
		case `bug_rangers`: {
			return <BugRangers />
		}
		case `clicker`: {
			return <Clicker />
		}
		case `server_control`: {
			return <ServerControl />
		}
	}
}

export function Clicker(): React.ReactNode {
	const count = useO(countAtom)
	const increment = runTransaction(incrementTX)
	useSyncContinuity(countContinuity)
	return (
		<article>
			<button
				type="button"
				onClick={() => {
					increment()
				}}
			>
				count is {count}
			</button>
			<p>Let's see how high we can count!</p>
		</article>
	)
}

export function ServerControl(): React.ReactNode {
	const cpuCount = usePullAtom(cpuCountAtom)
	usePullMutable(roomKeysAtom)
	const roomKeys = useJSON(roomKeysAtom)
	const userKey = `user::${useO(authAtom)!.userId}` satisfies UserKey
	usePullMutableAtomFamilyMember(
		getInternalRelations(usersInRooms, `split`)[1],
		userKey,
	)
	const myRoomKeys = useJSON(
		getInternalRelations(usersInRooms, `split`)[1],
		userKey,
	)

	console.log(`👺`, {
		roomIds: roomKeys,
		userKey,
		myRoomKeys,
	})

	const roomSocket = useRealtimeRooms<ActualWorkerName>()

	return (
		<article>
			{Array.from({ length: cpuCount }).map((_, i) => (
				<div key={i}>
					<span>
						{i}: {roomKeys[i]} {myRoomKeys.includes(roomKeys[i]) ? `👍` : `👎`}
					</span>
					{roomKeys[i] === undefined ? null : myRoomKeys.includes(
							roomKeys[i],
						) ? (
						<button
							type="button"
							onClick={() => {
								roomSocket.emit(`leaveRoom`)
							}}
						>
							leave
						</button>
					) : (
						<button
							type="button"
							onClick={() => {
								roomSocket.emit(`joinRoom`, roomKeys[i])
							}}
						>
							join
						</button>
					)}
				</div>
			))}
			<button
				type="button"
				onClick={() => {
					roomSocket.emit(`createRoom`, `backend.worker.game.bun`)
				}}
			>
				create room
			</button>
			<p>Let's see how high we can count!</p>
		</article>
	)
}
