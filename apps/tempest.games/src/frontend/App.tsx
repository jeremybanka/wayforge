import { useO } from "atom.io/react"

import { RESPONSE_DICTIONARY } from "../library/response-dictionary"
import * as svg from "./<svg>"
import { Anchor } from "./Anchor"
import scss from "./App.module.scss"
import { routeSelector } from "./services/router-service"
import { Game } from "./views/Game"
import { Login } from "./views/Login"
import { SignUp } from "./views/SignUp"

export function App(): JSX.Element {
	const route = useO(routeSelector)

	return (
		<main className={scss.class}>
			<div>
				<svg.tempest />
			</div>
			<Anchor href="/login">Login</Anchor>
			<Anchor href="/sign_up">Sign Up</Anchor>
			<Anchor href="/game">Game</Anchor>
			{(() => {
				switch (route) {
					case 401:
					case 404:
						return (
							<article>
								<h1>{route}</h1>
								<h2>{RESPONSE_DICTIONARY[route]}</h2>
							</article>
						)
					default: {
						const [root, ...rest] = route
						switch (root) {
							case `login`:
								return <Login />
							case `sign_up`:
								return <SignUp />
							case `game`:
								return <Game />
						}
					}
				}
			})()}
		</main>
	)
}
