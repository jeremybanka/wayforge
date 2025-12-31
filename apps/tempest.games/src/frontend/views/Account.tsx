import { getState, setState } from "atom.io"
import { useO } from "atom.io/react"
import React, { useEffect } from "react"

import {
	authAtom,
	authTargetAtom,
	emailInputAtom,
	emailIssuesSelector,
	isUsernameTakenQuerySelector,
	oneTimeCodeInputAtom,
	oneTimeCodeNewEmailInputAtom,
	passwordInputAtom,
	passwordIssuesSelector,
	socket,
	usernameInputAtom,
	usernameIssuesSelector,
} from "../services/socket-auth-service"
import { trpcClient } from "../services/trpc-client-service"
import {
	accountEditingAtom,
	emailInputElementAtom,
	password0InputElementAtom,
	usernameInputElementAtom,
} from "./Account/account-state"
import { Form } from "./Account/Form"

export function Account(): React.ReactNode {
	const auth = useO(authAtom)
	const usernameIsTaken = useO(isUsernameTakenQuerySelector)

	useEffect(() => {
		if (auth) setState(emailInputAtom, auth.email)
		if (auth?.password) setState(passwordInputAtom, `••••••••••••`)
	}, [])

	if (!auth) {
		return <p>You must be logged in to verify your account.</p>
	}

	return (
		<article data-css="editor">
			<Form
				label="username"
				inputToken={usernameInputAtom}
				issuesToken={usernameIssuesSelector}
				inputElementToken={usernameInputElementAtom}
				initialState={[`username`]}
				onSubmit={async (input) => {
					await new Promise((resolve) => {
						socket.once(`usernameChanged`, resolve)
						socket.emit(`changeUsername`, input)
					})
					setState(accountEditingAtom, [])
					return input
				}}
				extraIssues={
					usernameIsTaken === true ? (
						Error.isError(usernameIsTaken) ? null : (
							<span>This username is taken.</span>
						)
					) : null
				}
			/>
			<Form
				label="email"
				inputToken={emailInputAtom}
				issuesToken={emailIssuesSelector}
				inputElementToken={emailInputElementAtom}
				initialState={[`email`]}
				onSubmit={async (input) => {
					const accountEditingState = getState(accountEditingAtom)
					if (accountEditingState[0] !== `email`) {
						return new Error(`field not email`)
					}
					switch (accountEditingState.length) {
						case 1: {
							const { userKey: authTarget, nextStep } =
								await trpcClient.offerNewEmail.mutate({
									emailOffered: input,
								})
							console.log({ authTarget, nextStep })
							switch (nextStep) {
								case `otc_login`: {
									setState(authTargetAtom, authTarget)
									setState(accountEditingAtom, [`email`, `otcLogin`])
									break
								}
								case `password_login`: {
									setState(authTargetAtom, authTarget)
									setState(accountEditingAtom, [`email`, `passwordLogin`])
									break
								}
								case `otc_verify`: {
									setState(authTargetAtom, authTarget)
									setState(oneTimeCodeInputAtom, `not needed`)
									setState(accountEditingAtom, [
										`email`,
										`otcLogin`,
										`otcVerify`,
									])
									break
								}
							}
							return authTarget
						}

						case 2:
							console.log(`case 2`)
							switch (accountEditingState[1]) {
								case `otcLogin`: {
									console.log(`case 2.1`)
									const authTarget = getState(authTargetAtom)
									if (!authTarget) return new Error(`No auth target`)
									const otc = getState(oneTimeCodeInputAtom)
									const response = await trpcClient.verifyAccountAction.mutate({
										oneTimeCode: otc,
										userKey: authTarget,
									})
									setState(authAtom, response)
									setState(accountEditingAtom, [
										`email`,
										`otcLogin`,
										`otcVerify`,
									])
									return authTarget
								}
								case `passwordLogin`:
									return new Error(`not implemented`)
							}
							break

						case 3: {
							const authTarget = getState(authTargetAtom)
							if (!authTarget) return new Error(`No auth target`)
							const otcNew = getState(oneTimeCodeNewEmailInputAtom)
							const response = await trpcClient.verifyAccountAction.mutate({
								oneTimeCode: otcNew,
								userKey: authTarget,
							})
							setState(authAtom, response)
							setState(accountEditingAtom, [])
							return response.email
						}
					}
				}}
			/>

			<Form
				label="new-password"
				inputToken={passwordInputAtom}
				issuesToken={passwordIssuesSelector}
				inputElementToken={password0InputElementAtom}
				initialState={
					auth.password ? [`new-password`, `otcVerify`] : [`new-password`]
				}
				onSubmit={async (input) => {
					const accountEditingState = getState(accountEditingAtom)
					if (accountEditingState[0] !== `new-password`) {
						return new Error(`field not new-password`)
					}
					switch (accountEditingState.length) {
						case 1: {
							await trpcClient.setPassword.mutate({ password: input })
							setState(passwordInputAtom, `••••••••••••`)
							setState(authAtom, (prev) =>
								prev ? { ...prev, password: true } : prev,
							)
							setState(accountEditingAtom, [])
							return `done`
						}
						case 2: {
							const userKey = getState(authTargetAtom)
							if (!userKey) return new Error(`No userKey`)
							await trpcClient.verifyAccountAction.mutate({
								oneTimeCode: getState(oneTimeCodeInputAtom),
								userKey,
							})
							setState(authAtom, (prev) =>
								prev ? { ...prev, password: false } : prev,
							)
							setState(passwordInputAtom, ``)
							setState(accountEditingAtom, [`new-password`])
							return `done`
						}
					}
				}}
				onCancel={() => {
					if (auth.password) setState(passwordInputAtom, `••••••••••••`)
				}}
				onOpen={async () => {
					if (auth.password) {
						const userKey = getState(authTargetAtom)
						if (!userKey) return new Error(`No userKey`)
						await trpcClient.startPasswordReset.mutate({ userKey })
					}
				}}
			/>
		</article>
	)
}
