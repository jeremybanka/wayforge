import { TRPCError } from "@trpc/server"
import { setState } from "atom.io"
import { useI, useO } from "atom.io/react"
import { onMount } from "atom.io/realtime-react"
import React from "react"

import { navigate } from "../services/router-service"
import { authAtom, tokenInputAtom } from "../services/socket-auth-service"
import { trpc } from "../services/trpc-client-service"
import scss from "./Account.module.scss"

export function Account(): React.ReactNode {
	const auth = useO(authAtom)
	const token = useO(tokenInputAtom)
	const setToken = useI(tokenInputAtom)

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
	return <h1>Account</h1>

	// return (
	// 	<form
	// 		onSubmit={async (e) => {
	// 			e.preventDefault()
	// 			const password = password0
	// 			try {
	// 				await trpc.signUp.mutate({
	// 					username,
	// 					password,
	// 					email,
	// 				})
	// 				setPassword1(``)
	// 				setEmail(``)
	// 				navigate(`/login`)
	// 			} catch (thrown) {
	// 				if (thrown instanceof TRPCError) {
	// 					setError(thrown.message)
	// 				}
	// 			}
	// 		}}
	// 	>
	// 		<main>
	// 			{error ? <aside>{error}</aside> : null}
	// 			<label htmlFor="username">
	// 				<span>Username</span>
	// 				<input
	// 					id="username"
	// 					type="text"
	// 					value={username}
	// 					onChange={(e) => {
	// 						setUsername(e.target.value)
	// 					}}
	// 					autoComplete="username"
	// 					autoCapitalize="none"
	// 					style={setCssVars({
	// 						"--energy-color": username
	// 							? usernameIssues
	// 								? `red`
	// 								: `green`
	// 							: undefined,
	// 					})}
	// 				/>
	// 				{username && usernameIssues ? (
	// 					<aside>
	// 						{usernameIssues.map((issue) => (
	// 							<span key={issue.path.join(`.`)}>{issue.message}</span>
	// 						))}
	// 					</aside>
	// 				) : null}
	// 			</label>
	// 			<label htmlFor="password">
	// 				<span>Password</span>
	// 				<input
	// 					id="password0"
	// 					type="password"
	// 					value={password0}
	// 					onChange={(e) => {
	// 						setPassword0(e.target.value)
	// 					}}
	// 					autoComplete="new-password"
	// 					autoCapitalize="none"
	// 					style={setCssVars({
	// 						"--energy-color": password0
	// 							? password0Issues
	// 								? `red`
	// 								: `green`
	// 							: undefined,
	// 					})}
	// 				/>
	// 				{password0 && password0Issues ? (
	// 					<aside>
	// 						{password0Issues.map((issue) => (
	// 							<span key={issue.path.join(`.`)}>{issue.message}</span>
	// 						))}
	// 					</aside>
	// 				) : null}
	// 			</label>
	// 			<label htmlFor="password">
	// 				<span>Confirm Password</span>
	// 				<input
	// 					id="password1"
	// 					type="password"
	// 					value={password1}
	// 					onChange={(e) => {
	// 						setPassword1(e.target.value)
	// 					}}
	// 					autoComplete="new-password"
	// 					autoCapitalize="none"
	// 					style={setCssVars({
	// 						"--energy-color": password1
	// 							? password1Issues
	// 								? `red`
	// 								: `green`
	// 							: undefined,
	// 					})}
	// 				/>
	// 				{password1 && password1Issues ? (
	// 					<aside>
	// 						{password1Issues.map((issue) => (
	// 							<span key={issue.path.join(`.`)}>{issue.message}</span>
	// 						))}
	// 					</aside>
	// 				) : null}
	// 			</label>
	// 			<label htmlFor="email">
	// 				<span>Email</span>
	// 				<input
	// 					id="email"
	// 					type="email"
	// 					value={email}
	// 					onChange={(e) => {
	// 						setEmail(e.target.value)
	// 					}}
	// 					autoComplete="email"
	// 					autoCapitalize="none"
	// 					style={setCssVars({
	// 						"--energy-color": email
	// 							? emailIssues
	// 								? `red`
	// 								: `green`
	// 							: undefined,
	// 					})}
	// 				/>
	// 				{email && emailIssues ? (
	// 					<aside>
	// 						{emailIssues.map((issue) => (
	// 							<span key={issue.path.join(`.`)}>{issue.message}</span>
	// 						))}
	// 					</aside>
	// 				) : null}
	// 			</label>
	// 			<button type="submit" disabled={!signUpReady}>{`->`}</button>
	// 		</main>
	// 		<footer>
	// 			<Anchor href="/login">
	// 				Already have an account? <u>Log in</u> instead.
	// 			</Anchor>
	// 		</footer>
	// 	</form>
	// )
}
