import { setState } from "atom.io"
import { useI, useO } from "atom.io/react"
import * as React from "react"

import { asUUID } from "../../library/as-uuid-web"
import { env } from "../../library/env"
import { Anchor } from "../Anchor"
import { navigate } from "../services/router-service"
import {
	authAtom,
	password0InputAtom,
	socket,
	usernameInputAtom,
} from "../services/socket-auth-service"

export function Login(): React.ReactNode {
	const setUsername = useI(usernameInputAtom)
	const setPassword = useI(password0InputAtom)
	const username = useO(usernameInputAtom)
	const password = useO(password0InputAtom)

	const [error, setError] = React.useState<string | null>(null)

	return (
		<form
			onSubmit={async (e) => {
				e.preventDefault()
				const loginUUID = await asUUID(`login`)
				const response = await fetch(
					`${env.VITE_BACKEND_ORIGIN}/login-${loginUUID}`,
					{
						method: `POST`,
						body: JSON.stringify({ username, password }),
					},
				)
				console.log(response)
				if (response.status === 200) {
					setUsername(``)
					setPassword(``)
					const responseText = await response.text()
					const [, sessionKey] = responseText.split(` `)
					setState(authAtom, { username, sessionKey })
					socket.once(`connect`, () => {
						navigate(`/game`)
					})
				}
				if (response.status >= 400) {
					const responseText = await response.text()
					setError(responseText)
				}
			}}
		>
			<main>
				{error ? <aside>{error}</aside> : null}
				<label htmlFor="username">
					<span>Username</span>
					<input
						id="username"
						type="text"
						value={username}
						onChange={(e) => {
							setUsername(e.target.value)
						}}
						autoComplete="username"
						autoCapitalize="none"
					/>
				</label>
				<label htmlFor="password">
					<span>Password</span>
					<input
						id="password"
						type="password"
						value={password}
						onChange={(e) => {
							setPassword(e.target.value)
						}}
						autoComplete="current-password"
						autoCapitalize="none"
					/>
				</label>
				<button type="submit" disabled={!username || !password}>{`->`}</button>
			</main>
			<footer>
				<Anchor href="/sign_up">
					New here? <u>Sign up</u> for an account.
				</Anchor>
			</footer>
		</form>
	)
}
