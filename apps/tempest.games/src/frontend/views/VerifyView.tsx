import type { ViewOf } from "atom.io"
import { setState } from "atom.io"
import { useI, useO } from "atom.io/react"
import { useEffect, useId } from "react"

import { navigate, type Route } from "../services/router-service"
import { authAtom, oneTimeCodeInputAtom } from "../services/socket-auth-service"
import { trpcClient } from "../services/trpc-client-service"
import css from "./VerifyView.module.css"

export type VerifyRoute = Extract<Route, [`verify`, ...any]>

type VerifyProps = {
	route: ViewOf<VerifyRoute>
}

export function VerifyView({
	route: [, tokenFromUrl],
}: VerifyProps): React.ReactNode {
	const auth = useO(authAtom)
	const oneTimeCode = useO(oneTimeCodeInputAtom)
	const setOneTimeCode = useI(oneTimeCodeInputAtom)

	const codeInputId = `code-${useId()}`

	useEffect(() => {
		if (tokenFromUrl) {
			setOneTimeCode(tokenFromUrl)
		}
	}, [])

	if (!auth) {
		return (
			<verify-view className={css.class}>
				<p>You must be logged in to verify your account.</p>
			</verify-view>
		)
	}

	return (
		<verify-view className={css.class}>
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
						console.error(thrown)
					}
				}}
			>
				<form-fields>
					<p>Check your email for a verification code.</p>
					<label htmlFor={codeInputId}>
						<span>Verification code</span>
						<input
							id={codeInputId}
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
				</form-fields>
			</form>
		</verify-view>
	)
}
