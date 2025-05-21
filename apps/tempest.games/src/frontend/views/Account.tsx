import { getState, setState } from "atom.io"
import { useI, useO } from "atom.io/react"
import { onMount } from "atom.io/realtime-react"
import React from "react"

import { setCssVars } from "../../library/set-css-vars"
import {
	authAtom,
	authTargetAtom,
	emailInputAtom,
	emailIssuesSelector,
	isUsernameTakenQuerySelector,
	oneTimeCodeInputAtom,
	password0InputAtom,
	password0IssuesSelector,
	password1InputAtom,
	password1IssuesSelector,
	socket,
	usernameInputAtom,
	usernameIssuesSelector,
} from "../services/socket-auth-service"
import { trpcClient } from "../services/trpc-client-service"
import type { AccountString } from "./Account/account-state"
import {
	accountEditingAtom,
	buttonBlockActiveAtom,
	emailInputElementAtom,
	usernameInputElementAtom,
} from "./Account/account-state"
import { Form } from "./Account/Form"

export function Account(): React.ReactNode {
	const setPassword0 = useI(password0InputAtom)
	const setPassword1 = useI(password1InputAtom)
	const setEmail = useI(emailInputAtom)

	const auth = useO(authAtom)
	const password0 = useO(password0InputAtom)
	const password1 = useO(password1InputAtom)
	const password0Issues = useO(password0IssuesSelector)
	const password1Issues = useO(password1IssuesSelector)

	const [isEditing, setEditing] = React.useState<AccountString | null>(null)
	const usernameIsTaken = useO(isUsernameTakenQuerySelector)
	const passwordRef = React.useRef<HTMLInputElement>(null)

	onMount(() => {
		if (auth) setEmail(auth.email)
	})

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
				onSubmit={(input) =>
					new Promise((resolve) => {
						socket.once(`usernameChanged`, resolve)
						socket.emit(`changeUsername`, input)
					})
				}
				extraIssues={
					usernameIsTaken ? <span>This username is taken.</span> : null
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
					if (accountEditingState[0] === `email`) {
						switch (accountEditingState.length) {
							case 1: {
								const authTarget = await trpcClient.offerNewEmail.query({
									emailOffered: input,
								})
								setState(authTargetAtom, authTarget)
								setState(accountEditingAtom, [
									`email`,
									`one-time code to confirm email`,
								])
								return authTarget
							}

							case 2: {
								const authTarget = getState(authTargetAtom)
								if (!authTarget) return new Error(`No auth target`)
								const otc = getState(oneTimeCodeInputAtom)
								const response = await trpcClient.verifyAccountAction.mutate({
									oneTimeCode: otc,
									userKey: authTarget,
								})
								setState(authAtom, response)
								setState(accountEditingAtom, [])
								return response.email
							}
						}
					}
					return new Error(`field not email`)
				}}
			/>

			<form
				onSubmit={(e) => {
					e.preventDefault()
				}}
			>
				{isEditing === `password` ? (
					<button
						type="button"
						onClick={() => {
							setEditing(null)
						}}
					>
						x
					</button>
				) : null}
				<main>
					<label htmlFor="password">
						{password0 && password0Issues ? (
							<aside>
								{password0Issues.map((issue) => (
									<span key={issue.path.join(`.`)}>{issue.message}</span>
								))}
							</aside>
						) : null}
						<span>Password</span>
						<input
							id="password0"
							ref={passwordRef}
							type="password"
							placeholder={
								isEditing === `password`
									? ``
									: auth.password
										? `••••••••••••`
										: `none`
							}
							value={password0}
							onChange={(e) => {
								setPassword0(e.target.value)
							}}
							autoComplete="new-password"
							autoCapitalize="none"
							style={setCssVars({
								"--energy-color": auth.password ? `green` : undefined,
							})}
							disabled={isEditing !== `password`}
						/>
					</label>
					{isEditing === `password` ? (
						<label htmlFor="password">
							{password1 && password1Issues ? (
								<aside>
									{password1Issues.map((issue) => (
										<span key={issue.path.join(`.`)}>{issue.message}</span>
									))}
								</aside>
							) : null}
							<span>Confirm Password</span>
							<input
								id="password1"
								type="password"
								placeholder={
									isEditing === `password`
										? ``
										: auth.password
											? `••••••••••••`
											: `none`
								}
								value={password1}
								onChange={(e) => {
									setPassword1(e.target.value)
								}}
								autoComplete="new-password"
								autoCapitalize="none"
								style={setCssVars({
									"--energy-color": auth.password ? `green` : undefined,
								})}
								disabled={isEditing !== `password`}
							/>
						</label>
					) : null}
				</main>
				{isEditing === `password` ? (
					<button type="submit">{`->`}</button>
				) : auth.password ? (
					<button
						type="button"
						onClick={() => {
							setEditing(`password`)
						}}
					>
						/
					</button>
				) : (
					<button
						type="button"
						onClick={() => {
							setEditing(`password`)
						}}
					>
						{`+ add password`}
					</button>
				)}
			</form>
		</article>
	)
}
