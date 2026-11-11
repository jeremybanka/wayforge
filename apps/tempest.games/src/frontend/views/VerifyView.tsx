import type { Children } from "@atom.io/spa"
import { onMount, useGetter, useId, useSetter } from "@atom.io/spa"
import type { ViewOf } from "atom.io"
import { setState } from "atom.io"

import { navigate, type Route } from "../services/router-service"
import { authAtom, oneTimeCodeInputAtom } from "../services/socket-auth-service"
import { trpcClient } from "../services/trpc-client-service"
import css from "./VerifyView.module.css"

type VerifyRoute = Extract<Route, [`verify`, ...any]>

type VerifyProps = {
	key: ViewOf<VerifyRoute>
}

export function VerifyView(props: VerifyProps): Children {
	const auth = useGetter(authAtom)
	const oneTimeCode = useGetter(oneTimeCodeInputAtom)
	const setOneTimeCode = useSetter(oneTimeCodeInputAtom)

	const codeInputId = `code-${useId()}`

	onMount(() => {
		if (props.key[1]) {
			setOneTimeCode(props.key[1])
		}
	})

	return (
		<verify-view className={css.class}>
			{auth() ? (
				<form
					onSubmit={async (e) => {
						e.preventDefault()
						try {
							const response = await trpcClient.verifyAccountAction.mutate({
								oneTimeCode: oneTimeCode(),
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
								value={oneTimeCode()}
								onInput={(e) => {
									setOneTimeCode(e.currentTarget.value)
								}}
								placeholder="Verification code"
								autoComplete="one-time-code"
								autoCapitalize="none"
							/>
						</label>
					</form-fields>
				</form>
			) : (
				<p>You must be logged in to verify your account.</p>
			)}
		</verify-view>
	)
}
