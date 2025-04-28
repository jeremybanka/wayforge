import { TRPCClientError } from "@trpc/client"
import { useI, useO } from "atom.io/react"
import React from "react"

import { setCssVars } from "../../library/set-css-vars"
import { authAtom, oneTimeCodeInputAtom } from "../services/socket-auth-service"

export function Account(): React.ReactNode {
	const auth = useO(authAtom)
	const token = useO(oneTimeCodeInputAtom)
	const setToken = useI(oneTimeCodeInputAtom)

	const submitted = React.useState(false)
	const [error, setError] = React.useState<string | null>(null)

	// onMount(() => {
	// 	const url = new URL(window.location.href)
	// 	const tokenSearch = url.searchParams.get(`token`)
	// 	if (tokenSearch) {
	// 		setToken(tokenSearch)
	// 	}
	// })

	if (!auth) {
		return <p>You must be logged in to verify your account.</p>
	}

	return (
		<form
			onSubmit={async (e) => {
				e.preventDefault()
				try {
					await new Promise((pass) => setTimeout(pass, 10))
					console.log(`verifying token`, token)
				} catch (thrown) {
					if (thrown instanceof TRPCClientError) {
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
						value={auth.username}
						autoComplete="username"
						autoCapitalize="none"
					/>
				</label>
				<label htmlFor="password">
					<span>Password</span>
					<input
						id="password0"
						type="password"
						// value={auth.password ? `**********` : ``}
						placeholder="••••••••••••"
						onChange={(e) => {
							setToken(e.target.value)
						}}
						autoComplete="new-password"
						autoCapitalize="none"
						style={setCssVars({
							"--energy-color": auth.password ? `green` : undefined,
						})}
					/>
				</label>
				{/* <label htmlFor="password">
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
				</label> */}
				{/* <label htmlFor="email">
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
				</label> */}
				{/* <button type="submit" disabled={!signUpReady}>{`->`}</button> */}
			</main>
		</form>
	)
}
