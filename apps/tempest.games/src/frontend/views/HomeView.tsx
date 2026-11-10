import type { Children } from "@atom.io/spa"
import { useGetter, useId, useSetter } from "@atom.io/spa"
import { bindScene } from "@atom.io/spa/renderer"
import { TRPCClientError } from "@trpc/client"
import { getState, setState } from "atom.io"

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
import { useLocalState } from "../services/spa-state"
import { trpcClient } from "../services/trpc-client-service"
import css from "./HomeView.module.css"

export function HomeView(): Children {
	const setEmail = useSetter(emailInputAtom)
	const setPassword = useSetter(passwordInputAtom)
	const setOneTimeCode = useSetter(oneTimeCodeInputAtom)
	const email = useGetter(emailLowercaseSelector)
	const password = useGetter(passwordInputAtom)
	const oneTimeCode = useGetter(oneTimeCodeInputAtom)
	const emailInputId = `email-${useId()}`
	const passwordInputId = `password-${useId()}`
	const oneTimeCodeInputId = `one-time-code-${useId()}`

	const [error, setError] = useLocalState<string | null>(null)
	const [currentlyEntering, setCurrentlyEntering] = useLocalState<
		`email` | `otc` | `password`
	>(`email`)

	const formId = `form-${useId()}`
	bindScene(oneTimeCode, (code) => {
		if (code.length === 6) {
			const form = document.getElementById(formId)
			if (form instanceof HTMLFormElement) {
				form.requestSubmit()
			}
		}
	})

	return (
		<home-view className={css.class}>
			<form
				id={formId}
				onSubmit={async (e) => {
					e.preventDefault()
					const currentAuthTarget = getState(authTargetAtom)
					try {
						switch (currentlyEntering()) {
							case `email`: {
								const { nextStep, userKey: newAuthTarget } =
									await trpcClient.declareAuthTarget.query({
										email: email(),
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
										oneTimeCode: oneTimeCode(),
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
									email: email(),
									password: password(),
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
					{error() ? <aside>{error()}</aside> : null}
					<label htmlFor={emailInputId}>
						<span>Email</span>
						<input
							id={emailInputId}
							type="text"
							value={email()}
							onInput={(e) => {
								setEmail(e.currentTarget.value)
							}}
							autoComplete="email"
							autoCapitalize="none"
							disabled={currentlyEntering() !== `email`}
						/>
					</label>
					{currentlyEntering() === `password` ? (
						<label htmlFor={passwordInputId}>
							<span>Password</span>
							<input
								id={passwordInputId}
								type="password"
								value={password()}
								onInput={(e) => {
									setPassword(e.currentTarget.value)
								}}
								autoComplete="current-password"
								autoCapitalize="none"
								autoFocus={currentlyEntering() === `password`}
							/>
						</label>
					) : null}
					{currentlyEntering() === `otc` ? (
						<label htmlFor={oneTimeCodeInputId}>
							<span>One-time Code</span>
							<input
								id={oneTimeCodeInputId}
								type="number"
								inputMode="numeric"
								enterKeyHint="go"
								value={oneTimeCode()}
								onInput={(e) => {
									setOneTimeCode(e.currentTarget.value)
								}}
								autoComplete="one-time-code"
								autoCapitalize="none"
								autoFocus={currentlyEntering() === `otc`}
							/>
						</label>
					) : null}
					<form-actions>
						{currentlyEntering() === `password` ? (
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
								(!email() && currentlyEntering() === `email`) ||
								(!password() && currentlyEntering() === `password`) ||
								(!oneTimeCode() && currentlyEntering() === `otc`)
							}
						>{`>>->`}</button>
					</form-actions>
				</form-fields>
			</form>
		</home-view>
	)
}
