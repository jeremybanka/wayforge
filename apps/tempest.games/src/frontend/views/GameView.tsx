import type { ViewOf } from "atom.io"
import { toEntries } from "atom.io/foundations/entries"
import * as React from "react"

import { type Route, ROUTES } from "../services/router-service"
import { BugRangers } from "./Games/BugRangers"
import { CarbiterView } from "./Games/CarbiterView"
import css from "./GameView.module.css"
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
		<game-view className={css.class}>
			{gameId ? <Game gameId={gameId} /> : <GameIndex />}
		</game-view>
	)
}

function GameIndex(): React.ReactNode {
	return (
		<article>
			<nav>
				<a href={`/game/hexiom`}>
					<h1>HEXIOM</h1>
				</a>
			</nav>
		</article>
	)
}

const GAMES = toEntries(ROUTES[1].game[1]).map(([gameId]) => gameId)
type GameId = (typeof GAMES)[number]
export type GameProps = { gameId: GameId }
function Game(props: GameProps): React.ReactNode {
	switch (props.gameId) {
		case `hexiom`: {
			return <BugRangers />
		}
		case `server_control`: {
			return <ServerControl />
		}
		case `carbiter`: {
			return <CarbiterView />
		}
	}
}
