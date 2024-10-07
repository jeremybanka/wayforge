import { setState } from "atom.io"
import { useI, useO } from "atom.io/react"

import { asUUID } from "../../library/as-uuid-web"
import { env } from "../../library/env"
import { viewIntendedAtom } from "../App"
import { authAtom } from "../services/socket-auth"
import { password0InputAtom, usernameInputAtom } from "./SignUp"

export function Login(): JSX.Element {
	const setUsername = useI(usernameInputAtom)
	const setPassword = useI(password0InputAtom)
	const username = useO(usernameInputAtom)
	const password = useO(password0InputAtom)
	return (
		<form
			className="card"
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
				if (response.status === 200) {
					setUsername(``)
					setPassword(``)
					setState(viewIntendedAtom, `game`)
					const responseText = await response.text()
					const [, sessionKey] = responseText.split(` `)
					setState(authAtom, { username, sessionKey })
				}
			}}
		>
			<input
				type="text"
				value={username}
				onChange={(e) => {
					setUsername(e.target.value)
				}}
			/>
			<input
				type="password"
				value={password}
				onChange={(e) => {
					setPassword(e.target.value)
				}}
			/>
			<button type="submit">Login</button>
		</form>
	)
}
