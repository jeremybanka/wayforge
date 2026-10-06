import { TRPCClientError } from "@trpc/client"
import { getState, setState } from "atom.io"
import { useI, useO } from "atom.io/react"
import * as React from "react"

import { navigate } from "../services/router-service"
import {
	authAtom,
	authTargetAtom,
	emailInputAtom,
	emailLowercaseSelector,
	oneTimeCodeInputAtom,
	passwordInputAtom,
	socket,
} from "../services/socket-auth-service"
import { trpcClient } from "../services/trpc-client-service"
import css from "./HomeView.module.css"

export function HomeView(): React.ReactNode {
	const setEmail = useI(emailInputAtom)
	const setPassword = useI(passwordInputAtom)
	const setOneTimeCode = useI(oneTimeCodeInputAtom)
	const email = useO(emailLowercaseSelector)
	const password = useO(passwordInputAtom)
	const oneTimeCode = useO(oneTimeCodeInputAtom)
	const emailInputId = `email-${React.useId()}`
	const passwordInputId = `password-${React.useId()}`
	const oneTimeCodeInputId = `one-time-code-${React.useId()}`

	const [error, setError] = React.useState<string | null>(null)
	const [currentlyEntering, setCurrentlyEntering] = React.useState<
		`email` | `otc` | `password`
	>(`email`)

	const formId = `form-${React.useId()}`
	React.useEffect(() => {
		if (oneTimeCode.length === 6) {
			const form = document.getElementById(formId)
			if (form instanceof HTMLFormElement) {
				form.requestSubmit()
			}
		}
	}, [oneTimeCode])

	return (
		<home-view className={css.class}>
			<form
				id={formId}
				onSubmit={async (e) => {
					e.preventDefault()
					const currentAuthTarget = getState(authTargetAtom)
					try {
						switch (currentlyEntering) {
							case `email`: {
								const { nextStep, userKey: newAuthTarget } =
									await trpcClient.declareAuthTarget.query({
										email,
									})
								setState(authTargetAtom, newAuthTarget)
								switch (nextStep) {
									case `otc_login`:
									case `otc_verify`: {
										setCurrentlyEntering(`otc`)
										break
									}
									case `password_login`: {
										setCurrentlyEntering(`password`)
										break
									}
								}
								break
							}
							case `otc`: {
								if (!currentAuthTarget) {
									console.error(`somehow userKey is null`)
									return
								}
								const actionResponse =
									await trpcClient.verifyAccountAction.mutate({
										oneTimeCode,
										userKey: currentAuthTarget,
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
								const response = await trpcClient.openSession.mutate({
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
						}
					} catch (thrown) {
						if (thrown instanceof TRPCClientError) {
							setError(thrown.message)
						}
					}
				}}
			>
				<form-fields>
					{error ? <aside>{error}</aside> : null}
					<label htmlFor={emailInputId}>
						<span>Email</span>
						<input
							id={emailInputId}
							type="text"
							value={email}
							onChange={(e) => {
								setEmail(e.target.value)
							}}
							autoComplete="email"
							autoCapitalize="none"
							disabled={currentlyEntering !== `email`}
						/>
					</label>
					{currentlyEntering === `password` ? (
						<label htmlFor={passwordInputId}>
							<span>Password</span>
							<input
								id={passwordInputId}
								type="password"
								value={password}
								onChange={(e) => {
									setPassword(e.target.value)
								}}
								autoComplete="current-password"
								autoCapitalize="none"
								autoFocus={currentlyEntering === `password`}
							/>
						</label>
					) : null}
					{currentlyEntering === `otc` ? (
						<label htmlFor={oneTimeCodeInputId}>
							<span>One-time Code</span>
							<input
								id={oneTimeCodeInputId}
								type="number"
								inputMode="numeric"
								enterKeyHint="go"
								value={oneTimeCode}
								onChange={(e) => {
									setOneTimeCode(e.target.value)
								}}
								autoComplete="one-time-code"
								autoCapitalize="none"
								autoFocus={currentlyEntering === `otc`}
							/>
						</label>
					) : null}
					<form-actions>
						{currentlyEntering === `password` ? (
							<button
								type="button"
								onClick={async () => {
									const userKey = getState(authTargetAtom)
									if (!userKey) return new Error(`No userKey`)
									await trpcClient.startPasswordReset.mutate({ userKey })
									setCurrentlyEntering(`otc`)
								}}
							>{`Forgot Password?`}</button>
						) : null}
						<span />
						<button
							type="submit"
							disabled={
								(!email && currentlyEntering === `email`) ||
								(!password && currentlyEntering === `password`) ||
								(!oneTimeCode && currentlyEntering === `otc`)
							}
						>{`>>->`}</button>
					</form-actions>
				</form-fields>
			</form>
		</home-view>
	)
}
