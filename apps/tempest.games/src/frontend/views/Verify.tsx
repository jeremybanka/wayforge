import { TRPCClientError } from "@trpc/client"
import { setState } from "atom.io"
import { useI, useO } from "atom.io/react"
import { onMount } from "atom.io/realtime-react"
import React from "react"

import { navigate, type Route } from "../services/router-service"
import { authAtom, oneTimeCodeInputAtom } from "../services/socket-auth-service"
import { trpcClient } from "../services/trpc-client-service"

export type VerifyRoute = Extract<Route, [`verify`, ...any]>

type VerifyProps = {
	route: VerifyRoute
}

export function Verify({
	route: [, tokenFromUrl],
}: VerifyProps): React.ReactNode {
	const auth = useO(authAtom)
	const oneTimeCode = useO(oneTimeCodeInputAtom)
	const setOneTimeCode = useI(oneTimeCodeInputAtom)

	const submitted = React.useState(false)
	const [error, setError] = React.useState<string | null>(null)

	onMount(() => {
		if (tokenFromUrl) {
			setOneTimeCode(tokenFromUrl)
		}
	})

	if (!auth) {
		return <p>You must be logged in to verify your account.</p>
	}

	const { verification } = auth

	onMount(() => {
		if (!oneTimeCode) return
		console.log(`verifying token`, oneTimeCode)
	})

	return (
		<form
			onSubmit={async (e) => {
				e.preventDefault()
				try {
					const response = await trpcClient.verifyAccountAction.mutate({
						oneTimeCode,
						userKey: `CHANGEME`,
					})
					setState(authAtom, response)
					if (response.action === `resetPassword`) {
						navigate(`/account`)
					} else {
						navigate(`/game`)
					}
				} catch (thrown) {
					if (thrown instanceof TRPCClientError) {
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
						value={oneTimeCode}
						onChange={(e) => {
							setOneTimeCode(e.target.value)
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
