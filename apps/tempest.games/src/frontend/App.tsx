import { useO } from "atom.io/react"
import * as React from "react"

import { RESPONSE_DICTIONARY } from "../library/response-dictionary"
import * as svg from "./<svg>"
import { Anchor } from "./Anchor"
import scss from "./App.module.scss"
import { routeSelector } from "./services/router-service"
import { Account } from "./views/Account"
import { Admin } from "./views/Admin"
import { GameView } from "./views/Game"
import { Login } from "./views/Login"
import { SignUp } from "./views/SignUp"
import { Verify } from "./views/Verify"

export function App(): React.ReactNode {
	const route = useO(routeSelector)

	return (
		<main className={scss[`class`]}>
			<header>
				<svg.tempest />
			</header>
			<main>
				{typeof route === `number` ? (
					<article>
						<h1>{route}</h1>
						<h2>{JSON.parse(RESPONSE_DICTIONARY[route])}</h2>
						<Anchor href="/login">Return to Home Page</Anchor>
					</article>
				) : (
					(() => {
						switch (route[0]) {
							case `admin`:
								return <Admin />
							case `login`:
								return <Login />
							case `sign_up`:
								return <SignUp />
							case `game`:
								return <GameView route={route} />
							case `verify`:
								return <Verify route={route} />
							case `account`:
								return <Account />
						}
					})()
				)}
			</main>
		</main>
	)
}
