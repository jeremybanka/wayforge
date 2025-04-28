import { TRPCClientError } from "@trpc/client"
import { setState } from "atom.io"
import { useI, useO } from "atom.io/react"
import { motion } from "motion/react"
import * as React from "react"

import { Anchor } from "../Anchor"
import { navigate } from "../services/router-service"
import {
	authAtom,
	emailInputAtom,
	oneTimeCodeInputAtom,
	password0InputAtom,
	socket,
} from "../services/socket-auth-service"
import { trpc } from "../services/trpc-client-service"

export function Home(): React.ReactNode {
	const setEmail = useI(emailInputAtom)
	const setPassword = useI(password0InputAtom)
	const setOneTimeCode = useI(oneTimeCodeInputAtom)
	const email = useO(emailInputAtom)
	const password = useO(password0InputAtom)
	const oneTimeCode = useO(oneTimeCodeInputAtom)

	const [error, setError] = React.useState<string | null>(null)
	const [currentlyEntering, setCurrentlyEntering] = React.useState<
		`email` | `otp` | `password`
	>(`email`)

	return (
		<form
			onSubmit={async (e) => {
				e.preventDefault()
				try {
					const response = await trpc.signIn.mutate({
						email,
						password,
					})
					setEmail(``)
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
				<motion.label htmlFor="email">
					<span>Email</span>
					<input
						id="email"
						type="text"
						value={email}
						onChange={(e) => {
							setEmail(e.target.value)
						}}
						autoComplete="email"
						autoCapitalize="none"
						disabled={currentlyEntering !== `email`}
					/>
				</motion.label>
				{currentlyEntering === `password` ? (
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
				) : null}
				<button
					type="submit"
					disabled={
						(!email && currentlyEntering === `email`) ||
						(!password && currentlyEntering === `password`)
					}
				>{`>>->`}</button>
			</main>
			{/* <footer>
				<Anchor href="/sign_up">
					New here? <u>Sign up</u> for an account.
				</Anchor>
			</footer> */}
		</form>
	)
}
