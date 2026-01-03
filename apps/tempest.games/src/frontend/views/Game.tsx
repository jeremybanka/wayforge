import type { ViewOf } from "atom.io"
import { toEntries } from "atom.io/json"
import * as React from "react"

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
	return (
		<article className={scss[`class`]}>
			{gameId ? <Game gameId={gameId} /> : <GameIndex />}
		</article>
	)
}

export function GameIndex(): React.ReactNode {
	return (
		<nav>
			<Anchor href={`/game/hexiom`}>
				<h1>HEXIOM</h1>
			</Anchor>
		</nav>
	)
}

const GAMES = toEntries(ROUTES[1].game[1]).map(([gameId]) => gameId)
type GameId = (typeof GAMES)[number]
export type GameProps = { gameId: GameId }
export function Game(props: GameProps): React.ReactNode {
	switch (props.gameId) {
		case `hexiom`: {
			return <BugRangers />
		}
		case `server_control`: {
			return <ServerControl />
		}
	}
}
