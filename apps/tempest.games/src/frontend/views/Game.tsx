import { runTransaction } from "atom.io"
import { useO } from "atom.io/react"
import { useSyncContinuity } from "atom.io/realtime-react"

import { countAtom, countContinuity, incrementTX } from "../../library/store"
import type { Route } from "../services/router-service"

export type Tail<T extends any[]> = T extends [any, ...infer Rest] ? Rest : never

export type GameRoute = Tail<Extract<Route, [`game`, ...any]>>

export type GameIndexProps = {
	route: GameRoute
}

export function GameIndex({ route: [gameId] }: GameIndexProps): JSX.Element {
	return (
		<nav>{gameId ? <Game gameId={gameId} /> : <article>no game</article>}</nav>
	)
}

export type GameProps = {
	gameId: string
}

export function Game({ gameId }: GameProps): JSX.Element {
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
