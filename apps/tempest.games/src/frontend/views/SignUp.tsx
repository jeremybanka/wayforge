import { subscribe } from "atom.io"
import { useI, useO } from "atom.io/react"
import { useState } from "react"

import { asUUID } from "../../library/as-uuid-web"
import { env } from "../../library/env"
import { setCssVars } from "../../library/set-css-vars"
import { Anchor } from "../Anchor"
import { navigate } from "../services/router-service"
import {
	emailInputAtom,
	emailIssuesSelector,
	password0InputAtom,
	password0IssuesSelector,
	password1InputAtom,
	password1IssuesSelector,
	signUpReadySelector,
	usernameInputAtom,
	usernameIssuesSelector,
} from "../services/socket-auth-service"

export function SignUp(): JSX.Element {
	const setUsername = useI(usernameInputAtom)
	const setPassword0 = useI(password0InputAtom)
	const setPassword1 = useI(password1InputAtom)
	const setEmail = useI(emailInputAtom)
	const username = useO(usernameInputAtom)
	const password0 = useO(password0InputAtom)
	const password1 = useO(password1InputAtom)
	const email = useO(emailInputAtom)
	const usernameIssues = useO(usernameIssuesSelector)
	const password0Issues = useO(password0IssuesSelector)
	const password1Issues = useO(password1IssuesSelector)
	const emailIssues = useO(emailIssuesSelector)
	const signUpReady = useO(signUpReadySelector)

	const [error, setError] = useState<string | null>(null)

	return (
		<form
			onSubmit={async (e) => {
				e.preventDefault()
				const password = password0
				const signUpUUID = await asUUID(`sign-up`)
				const response = await fetch(
					`${env.VITE_BACKEND_ORIGIN}/sign-up-${signUpUUID}`,
					{
						method: `POST`,
						body: JSON.stringify({ username, password, email }),
					},
				)
				if (response.status === 201) {
					setPassword1(``)
					setEmail(``)
					navigate(`/login`)
				}
				if (response.status >= 400) {
					const responseText = await response.text()
					setError(responseText)
				}
			}}
		>
			<main>
				{error ? <aside>{error}</aside> : null}
				<label htmlFor="username">
					<span>Username</span>
					<input
						id="username"
						type="text"
						value={username}
						onChange={(e) => {
							setUsername(e.target.value)
						}}
						autoComplete="username"
						autoCapitalize="none"
						style={setCssVars({
							"--energy-color": username
								? usernameIssues
									? `red`
									: `green`
								: undefined,
						})}
					/>
					{username && usernameIssues ? (
						<aside>
							{usernameIssues.map((issue) => (
								<span key={issue.path.join(`.`)}>{issue.message}</span>
							))}
						</aside>
					) : null}
				</label>
				<label htmlFor="password">
					<span>Password</span>
					<input
						id="password0"
						type="password"
						value={password0}
						onChange={(e) => {
							setPassword0(e.target.value)
						}}
						autoComplete="new-password"
						autoCapitalize="none"
						style={setCssVars({
							"--energy-color": password0
								? password0Issues
									? `red`
									: `green`
								: undefined,
						})}
					/>
					{password0 && password0Issues ? (
						<aside>
							{password0Issues.map((issue) => (
								<span key={issue.path.join(`.`)}>{issue.message}</span>
							))}
						</aside>
					) : null}
				</label>
				<label htmlFor="password">
					<span>Confirm Password</span>
					<input
						id="password1"
						type="password"
						value={password1}
						onChange={(e) => {
							setPassword1(e.target.value)
						}}
						autoComplete="new-password"
						autoCapitalize="none"
						style={setCssVars({
							"--energy-color": password1
								? password1Issues
									? `red`
									: `green`
								: undefined,
						})}
					/>
					{password1 && password1Issues ? (
						<aside>
							{password1Issues.map((issue) => (
								<span key={issue.path.join(`.`)}>{issue.message}</span>
							))}
						</aside>
					) : null}
				</label>
				<label htmlFor="email">
					<span>Email</span>
					<input
						id="email"
						type="email"
						value={email}
						onChange={(e) => {
							setEmail(e.target.value)
						}}
						autoComplete="email"
						autoCapitalize="none"
						style={setCssVars({
							"--energy-color": email
								? emailIssues
									? `red`
									: `green`
								: undefined,
						})}
					/>
					{email && emailIssues ? (
						<aside>
							{emailIssues.map((issue) => (
								<span key={issue.path.join(`.`)}>{issue.message}</span>
							))}
						</aside>
					) : null}
				</label>
				<button type="submit" disabled={!signUpReady}>{`->`}</button>
			</main>
			<footer>
				<Anchor href="/login">
					Already have an account? <u>Log in</u> instead.
				</Anchor>
			</footer>
		</form>
	)
}
