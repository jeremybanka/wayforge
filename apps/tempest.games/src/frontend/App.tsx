import { useO } from "atom.io/react"

import { RESPONSE_DICTIONARY } from "../library/response-dictionary"
import * as svg from "./<svg>"
import scss from "./App.module.scss"
import { routeSelector } from "./services/router-service"
import { Admin } from "./views/Admin"
import { GameIndex } from "./views/Game"
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
								return <GameIndex route={rest} />
						}
					})()
				)}
			</main>
		</main>
	)
}
