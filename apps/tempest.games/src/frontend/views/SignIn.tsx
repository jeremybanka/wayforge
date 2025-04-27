import { TRPCClientError } from "@trpc/client"
import { setState } from "atom.io"
import { useI, useO } from "atom.io/react"
import * as React from "react"

import { Anchor } from "../Anchor"
import { navigate } from "../services/router-service"
import {
	authAtom,
	password0InputAtom,
	socket,
	usernameInputAtom,
} from "../services/socket-auth-service"
import { trpc } from "../services/trpc-client-service"

export function SignIn(): React.ReactNode {
	const setUsername = useI(usernameInputAtom)
	const setPassword = useI(password0InputAtom)
	const username = useO(usernameInputAtom)
	const password = useO(password0InputAtom)

	const [error, setError] = React.useState<string | null>(null)

	return (
		<form
			onSubmit={async (e) => {
				e.preventDefault()
				try {
					const response = await trpc.signIn.mutate({ username, password })
					setUsername(``)
					setPassword(``)
					setState(authAtom, response)
					socket.once(`connect`, () => {
						console.log(`✨ connected`)
						navigate(`/game`)
					})
				} catch (thrown) {
					if (thrown instanceof TRPCClientError) {
						setError(thrown.message)
					}
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
