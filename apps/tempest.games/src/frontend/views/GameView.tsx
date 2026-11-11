import type { Children } from "@atom.io/spa"
import type { ViewOf } from "atom.io"

import type { Route } from "../services/router-service"
import { BugRangers } from "./Games/BugRangers"
import { CarbiterView } from "./Games/CarbiterView"
import css from "./GameView.module.css"
import { ServerControl } from "./ServerControl"

type GameRoute = Extract<Route, [`game`, ...any]>

export type GameIndexProps = {
	key: ViewOf<GameRoute>
}

export function GameView(props: GameIndexProps): Children {
	return (
		<game-view className={css.class}>
			{props.key[1] ? <Game key={props.key[1]} /> : <GameIndex />}
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

type GameId = NonNullable<GameRoute[1]>
type GameProps = { key: GameId }
function Game(props: GameProps): Children {
	switch (props.key) {
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
