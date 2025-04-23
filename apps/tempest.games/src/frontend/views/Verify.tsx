import { TRPCError } from "@trpc/server"
import { setState } from "atom.io"
import { useI, useO } from "atom.io/react"
import { onMount } from "atom.io/realtime-react"
import React from "react"

import { navigate, type Route } from "../services/router-service"
import { authAtom, tokenInputAtom } from "../services/socket-auth-service"
import { trpc } from "../services/trpc-client-service"

export type VerifyRoute = Extract<Route, [`verify`, ...any]>

type VerifyProps = {
	route: VerifyRoute
}

export function Verify({
	route: [, tokenFromUrl],
}: VerifyProps): React.ReactNode {
	const auth = useO(authAtom)
	const token = useO(tokenInputAtom)
	const setToken = useI(tokenInputAtom)

	const submitted = React.useState(false)
	const [error, setError] = React.useState<string | null>(null)

	onMount(() => {
		if (tokenFromUrl) {
			setToken(tokenFromUrl)
		}
	})

	if (!auth) {
		return <p>You must be logged in to verify your account.</p>
	}

	const { verification } = auth

	onMount(() => {
		if (!token) return
		console.log(`verifying token`, token)
	})

	return (
		<form
			onSubmit={async (e) => {
				e.preventDefault()
				try {
					if (!auth) {
						console.error(`No auth`)
						return
					}
					const { username } = auth
					const response = await trpc.verifyAccountAction.mutate({
						token,
						username,
					})
					setState(authAtom, response)
					if (response.action === `resetPassword`) {
						navigate(`/account`)
					} else {
						navigate(`/game`)
					}
				} catch (thrown) {
					if (thrown instanceof TRPCError) {
						setError(thrown.message)
					}
				}
			}}
		>
			<main>
				<p>Check your email for a verification code.</p>
				<label htmlFor="code">
					<span>Verification code</span>
					<input
						id="code"
						type="text"
						value={token}
						onChange={(e) => {
							setToken(e.target.value)
						}}
						placeholder="Verification code"
						autoComplete="one-time-code"
						autoCapitalize="none"
					/>
				</label>
			</main>
		</form>
	)
}
