import { TRPCError } from "@trpc/server"
import { useI, useO } from "atom.io/react"
import * as React from "react"

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
import { trpc } from "../services/trpc-client-service"

export function SignUp(): React.ReactNode {
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

	const [error, setError] = React.useState<string | null>(null)

	return (
		<form
			onSubmit={async (e) => {
				e.preventDefault()
				const password = password0
				try {
					await trpc.signUp.mutate({
						username,
						password,
						email,
					})
					setPassword1(``)
					setEmail(``)
					navigate(`/sign_in`)
				} catch (thrown) {
					if (thrown instanceof TRPCError) {
						setError(thrown.message)
					}
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
				<Anchor href="/sign_in">
					Already have an account? <u>Log in</u> instead.
				</Anchor>
			</footer>
		</form>
	)
}
