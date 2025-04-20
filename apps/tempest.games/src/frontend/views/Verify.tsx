import { useO } from "atom.io/react"
import { onMount } from "atom.io/realtime-react"

import type { Route } from "../services/router-service"
import { authAtom } from "../services/socket-auth-service"

export type VerifyRoute = Extract<Route, [`verify`, ...any]>

type VerifyProps = {
	route: VerifyRoute
}

export function Verify({ route: [, token] }: VerifyProps): React.ReactNode {
	const auth = useO(authAtom)

	if (!auth) {
		return <p>You must be logged in to verify your account.</p>
	}

	const { verification } = auth

	onMount(() => {
		if (!token) return
		console.log(`verifying token`, token)
	})

	if (!token) {
		return (
			<form
				onSubmit={(e) => {
					e.preventDefault()
					console.log(`submit`)
				}}
			>
				<main>
					<p>Check your email for a verification code.</p>
					<label htmlFor="code">
						<span>Verification code</span>
						<input type="text" placeholder="Verification code" />
					</label>
				</main>
			</form>
		)
	}

	if (verification === `unverified`) {
		return <p>Verifying your account...</p>
	}

	return <p>Account verified.</p>
}
