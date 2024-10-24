import { useO } from "atom.io/react"

import { RESPONSE_DICTIONARY } from "../library/response-dictionary"
import * as svg from "./<svg>"
import { Anchor } from "./Anchor"
import scss from "./App.module.scss"
import { routeSelector } from "./services/router-service"
import { Admin } from "./views/Admin"
import { GameView } from "./views/Game"
import { Login } from "./views/Login"
import { SignUp } from "./views/SignUp"

export function App(): JSX.Element {
	const route = useO(routeSelector)

	return (
		<main className={scss.class}>
			<header>
				<svg.tempest />
			</header>
			<main>
				{typeof route === `number` ? (
					<article>
						<h1>{route}</h1>
						<h2>{RESPONSE_DICTIONARY[route]}</h2>
						<Anchor href="/login">Return to Home Page</Anchor>
					</article>
				) : (
					(() => {
						const [root, ...rest] = route
						switch (root) {
							case `admin`:
								return <Admin />
							case `login`:
								return <Login />
							case `sign_up`:
								return <SignUp />
							case `game`:
								return <GameView route={rest} />
						}
					})()
				)}
			</main>
		</main>
	)
}
