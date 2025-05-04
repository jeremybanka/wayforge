import { TRPCClientError } from "@trpc/client"
import { setState } from "atom.io"
import { useI, useO } from "atom.io/react"
import { motion } from "motion/react"
import * as React from "react"

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
	const [userKey, setUserKey] = React.useState<string | null>(null)
	const [currentlyEntering, setCurrentlyEntering] = React.useState<
		`email` | `otp` | `password`
	>(`email`)

	return (
		<form
			onSubmit={async (e) => {
				e.preventDefault()
				try {
					switch (currentlyEntering) {
						case `email`: {
							const { nextStep, userKey: newUserKey } =
								await trpc.authStage1.query({
									email,
								})
							setUserKey(newUserKey)
							switch (nextStep) {
								case `otp_login`:
								case `otp_verify`: {
									setCurrentlyEntering(`otp`)
									break
								}
								case `password_login`: {
									setCurrentlyEntering(`email`)
									break
								}
							}
							break
						}
						case `otp`: {
							if (!userKey) {
								console.error(`somehow userKey is null`)
								return
							}
							const actionResponse = await trpc.verifyAccountAction.mutate({
								oneTimeCode,
								userKey,
							})
							setState(authAtom, actionResponse)
							socket.once(`connect`, () => {
								navigate(`/game`)
								setEmail(``)
								setOneTimeCode(``)
							})
							break
						}
						case `password`: {
							const response = await trpc.openSession.mutate({
								email,
								password,
							})
							setState(authAtom, response)
							socket.once(`connect`, () => {
								navigate(`/game`)
								setEmail(``)
								setPassword(``)
							})
							break
						}
						default: {
							const response = await trpc.openSession.mutate({
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
						}
					}
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
							// biome-ignore lint/a11y/noAutofocus: this is really the best place to focus
							autoFocus={currentlyEntering === `password`}
						/>
					</label>
				) : null}
				{currentlyEntering === `otp` ? (
					<label htmlFor="otp">
						<span>One-time Code</span>
						<input
							id="otp"
							type="otp"
							value={oneTimeCode}
							onChange={(e) => {
								setOneTimeCode(e.target.value)
							}}
							autoComplete="one-time-code"
							autoCapitalize="none"
							// biome-ignore lint/a11y/noAutofocus: this is really the best place to focus
							autoFocus={currentlyEntering === `otp`}
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
