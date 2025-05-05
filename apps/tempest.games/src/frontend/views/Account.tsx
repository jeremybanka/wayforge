import { useI, useO } from "atom.io/react"
import { onMount } from "atom.io/realtime-react"
import React from "react"

import { setCssVars } from "../../library/set-css-vars"
import {
	authAtom,
	emailInputAtom,
	emailIssuesSelector,
	isUsernameTakenQuerySelector,
	oneTimeCodeInputAtom,
	password0InputAtom,
	password0IssuesSelector,
	password1InputAtom,
	password1IssuesSelector,
	signUpReadySelector,
	socket,
	usernameInputAtom,
	usernameIssuesSelector,
} from "../services/socket-auth-service"
import { trpcClient } from "../services/trpc-client-service"

export function Account(): React.ReactNode {
	const setUsername = useI(usernameInputAtom)
	const setPassword0 = useI(password0InputAtom)
	const setPassword1 = useI(password1InputAtom)
	const setEmail = useI(emailInputAtom)

	const auth = useO(authAtom)
	const token = useO(oneTimeCodeInputAtom)
	const username = useO(usernameInputAtom)
	const password0 = useO(password0InputAtom)
	const password1 = useO(password1InputAtom)
	const email = useO(emailInputAtom)
	const usernameIssues = useO(usernameIssuesSelector)
	const password0Issues = useO(password0IssuesSelector)
	const password1Issues = useO(password1IssuesSelector)
	const emailIssues = useO(emailIssuesSelector)
	const usernameIsTaken = useO(isUsernameTakenQuerySelector)

	const [submitted, setSubmitted] = React.useState(false)
	const [isEditing, setEditing] = React.useState<
		`email` | `password` | `username` | null
	>(null)
	const [error, setError] = React.useState<string | null>(null)
	const [buttonBlockActive, setButtonBlockActive] = React.useState(false)

	const usernameRef = React.useRef<HTMLInputElement>(null)
	const emailRef = React.useRef<HTMLInputElement>(null)
	const passwordRef = React.useRef<HTMLInputElement>(null)

	React.useEffect(() => {
		switch (isEditing) {
			case `username`: {
				usernameRef.current?.focus()
				break
			}
			case `password`: {
				passwordRef.current?.focus()
				break
			}
			case `email`: {
				break
			}
			case null: {
			}
		}
	})

	onMount(() => {
		if (auth) setEmail(auth.email)
	})

	if (!auth) {
		return <p>You must be logged in to verify your account.</p>
	}

	return (
		<article data-css="editor">
			<form
				onSubmit={(e) => {
					e.preventDefault()
					if (buttonBlockActive) {
						setButtonBlockActive(false)
						return
					}
					console.log(`submitted! changing username to`, username)
					socket.emit(`changeUsername`, username)
					setEditing(null)
				}}
			>
				{isEditing === `username` ? (
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
					<label htmlFor="username">
						{username && (usernameIssues || usernameIsTaken === true) ? (
							<aside>
								{usernameIsTaken === true ? (
									<span>This username is taken.</span>
								) : null}
								{usernameIssues?.map((issue) => (
									<span key={issue.path.join(`.`)}>{issue.message}</span>
								))}
							</aside>
						) : null}
						<span>Username</span>
						<input
							id="username"
							type="text"
							ref={usernameRef}
							value={username}
							onChange={(e) => {
								setUsername(e.target.value)
							}}
							autoComplete="username"
							autoCapitalize="none"
							disabled={isEditing !== `username`}
						/>
					</label>
				</main>
				{isEditing === `username` ? (
					<button type="submit" disabled={submitted}>
						{`->`}
					</button>
				) : (
					<button
						type="button"
						onMouseDown={() => {
							setButtonBlockActive(true)
							setEditing(`username`)
						}}
						onMouseUp={() => {
							setButtonBlockActive(false)
						}}
					>
						/
					</button>
				)}
			</form>

			<form
				onSubmit={(e) => {
					e.preventDefault()
				}}
			>
				{isEditing === `email` ? (
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
					{error ? <aside>{error}</aside> : null}
					<label htmlFor="email">
						{email && emailIssues ? (
							<aside>
								{emailIssues.map((issue) => (
									<span key={issue.path.join(`.`)}>{issue.message}</span>
								))}
							</aside>
						) : null}
						<span>Email</span>
						<input
							id="email"
							type="text"
							ref={emailRef}
							value={email}
							onChange={(e) => {
								setEmail(e.target.value)
							}}
							autoComplete="email"
							autoCapitalize="none"
							disabled={isEditing !== `email`}
						/>
					</label>
				</main>
				{isEditing === `email` ? (
					<button type="submit" disabled={submitted}>
						{`->`}
					</button>
				) : (
					<button
						type="button"
						onClick={() => {
							setEditing(`email`)
						}}
					>
						/
					</button>
				)}
			</form>

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
					{error ? <aside>{error}</aside> : null}
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
					<button type="submit" disabled={submitted}>
						{`->`}
					</button>
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
