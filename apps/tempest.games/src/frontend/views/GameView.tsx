import type { Children } from "@atom.io/spa"
import type { ViewOf } from "atom.io"
import { toEntries } from "atom.io/foundations/entries"

import { type Route, ROUTES } from "../services/router-service"
import { BugRangers } from "./Games/BugRangers"
import { CarbiterView } from "./Games/CarbiterView"
import css from "./GameView.module.css"
import { ServerControl } from "./ServerControl"

type GameRoute = Extract<Route, [`game`, ...any]>

export type GameIndexProps = {
	route: ViewOf<GameRoute>
}

export function GameView(props: GameIndexProps): Children {
	return (
		<game-view className={css.class}>
			{props.route[1] ? (
				<Game key={props.route[1]} gameId={props.route[1]} />
			) : (
				<GameIndex />
			)}
		</game-view>
	)
}

function GameIndex(): Children {
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
type GameProps = { gameId: GameId }
function Game(props: GameProps): Children {
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
