import { runTransaction } from "atom.io"
import { toEntries } from "atom.io/json"
import { useO } from "atom.io/react"
import { useSyncContinuity } from "atom.io/realtime-react"
import * as React from "react"

import { countAtom, countContinuity, incrementTX } from "../../library/store"
import { Anchor } from "../Anchor"
import { type Route, ROUTES } from "../services/router-service"

export type Tail<T extends any[]> = T extends [any, ...infer Rest] ? Rest : never

export type GameRoute = Tail<Extract<Route, [`game`, ...any]>>

export type GameIndexProps = {
	route: GameRoute
}

export function GameView({ route: [gameId] }: GameIndexProps): React.ReactNode {
	return <article>{gameId ? <Game gameId={gameId} /> : <GameIndex />}</article>
}

export function GameIndex(): React.ReactNode {
	return (
		<nav>
			<Anchor href="/game/clicker">Clicker</Anchor>
		</nav>
	)
}

export type GameProps = {
	gameId: `clicker`
}

const GAMES = toEntries(ROUTES[1].game[1])

export function Game({ gameId }: GameProps): React.ReactNode {
	console.log(gameId)
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
