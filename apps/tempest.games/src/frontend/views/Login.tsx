import { setState } from "atom.io"
import { useI, useO } from "atom.io/react"

import { asUUID } from "../../library/as-uuid-web"
import { env } from "../../library/env"
import { Anchor } from "../Anchor"
import { navigate } from "../services/router-service"
import {
	authAtom,
	password0InputAtom,
	usernameInputAtom,
} from "../services/socket-auth-service"

export function Login(): JSX.Element {
	const setUsername = useI(usernameInputAtom)
	const setPassword = useI(password0InputAtom)
	const username = useO(usernameInputAtom)
	const password = useO(password0InputAtom)
	return (
		<form
			onSubmit={async (e) => {
				e.preventDefault()
				const signInUUID = await asUUID(`login`)
				const response = await fetch(
					`${env.VITE_BACKEND_ORIGIN}/login-${signInUUID}`,
					{
						method: `POST`,
						body: JSON.stringify({ username, password }),
					},
				)
				console.log(response)
				if (response.status === 200) {
					setUsername(``)
					setPassword(``)
					navigate(`/game`)
					const responseText = await response.text()
					const [, sessionKey] = responseText.split(` `)
					setState(authAtom, { username, sessionKey })
				}
			}}
		>
			<main>
				<label htmlFor="username">
					<span> Username</span>
					<input
						id="username"
						type="text"
						value={username}
						onChange={(e) => {
							setUsername(e.target.value)
						}}
						autoComplete="username"
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
					/>
				</label>
				<button type="submit">{`->`}</button>
			</main>
			<footer>
				<Anchor href="/sign_up">
					New here? <u>Sign up</u> for an account.
				</Anchor>
			</footer>
		</form>
	)
}
