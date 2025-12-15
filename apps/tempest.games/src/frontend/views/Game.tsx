import type { ViewOf } from "atom.io"
import { runTransaction } from "atom.io"
import { toEntries } from "atom.io/json"
import { useO } from "atom.io/react"
import type { UserKey } from "atom.io/realtime"
import { myUserKeyAtom } from "atom.io/realtime-client"
import { usePullAtom, useSyncContinuity } from "atom.io/realtime-react"
import * as React from "react"

import { countAtom, countContinuity, incrementTX } from "../../library/store"
import { Anchor } from "../Anchor"
import { type Route, ROUTES } from "../services/router-service"
import scss from "./Game.module.scss"
import { BugRangers } from "./Games/BugRangers"
import { ServerControl } from "./ServerControl"

export type Tail<T extends any[]> = T extends [any, ...infer Rest] ? Rest : never

export type GameRoute = Extract<Route, [`game`, ...any]>

export type GameIndexProps = {
	route: ViewOf<GameRoute>
}

export function GameView({
	route: [, gameId],
}: GameIndexProps): React.ReactNode {
	const userKey = usePullAtom(myUserKeyAtom)
	return (
		<article className={scss[`class`]}>
			{gameId && userKey ? (
				<Game gameId={gameId} userKey={userKey} />
			) : (
				<GameIndex />
			)}
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
export type GameProps = { gameId: GameId; userKey: UserKey }
export function Game(props: GameProps): React.ReactNode {
	switch (props.gameId) {
		case `bug_rangers`: {
			return <BugRangers {...props} />
		}
		case `clicker`: {
			return <Clicker />
		}
		case `server_control`: {
			return <ServerControl {...props} />
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
