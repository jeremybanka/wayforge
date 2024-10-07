import { useI, useO } from "atom.io/react"

import { asUUID } from "../../library/as-uuid-web"
import { env } from "../../library/env"
import { navigate } from "../services/router-service"
import {
	emailInputAtom,
	password0InputAtom,
	password1InputAtom,
	usernameInputAtom,
} from "../services/socket-auth-service"

export function SignUp(): JSX.Element {
	const setUsername = useI(usernameInputAtom)
	const setPassword0 = useI(password0InputAtom)
	const setPassword1 = useI(password1InputAtom)
	const setEmail = useI(emailInputAtom)
	const username = useO(usernameInputAtom)
	const password0 = useO(password0InputAtom)
	const password1 = useO(password1InputAtom)
	const email = useO(emailInputAtom)
	return (
		<form
			className="card"
			onSubmit={async (e) => {
				e.preventDefault()
				const password = password0
				const signUpUUID = await asUUID(`sign-up`)
				const response = await fetch(
					`${env.VITE_BACKEND_ORIGIN}/sign-up-${signUpUUID}`,
					{
						method: `POST`,
						body: JSON.stringify({ username, password, email }),
					},
				)
				if (response.status === 200) {
					setPassword1(``)
					setEmail(``)
					navigate(`/login`)
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
				value={password0}
				onChange={(e) => {
					setPassword0(e.target.value)
				}}
			/>
			<input
				type="password"
				value={password1}
				onChange={(e) => {
					setPassword1(e.target.value)
				}}
			/>
			<input
				type="email"
				value={email}
				onChange={(e) => {
					setEmail(e.target.value)
				}}
			/>
			<button type="submit">Sign Up</button>
		</form>
	)
}
