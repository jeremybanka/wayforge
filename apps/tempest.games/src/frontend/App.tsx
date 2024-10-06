import "./App.css"

import { atom, runTransaction, selector, setState } from "atom.io"
import { useI, useO } from "atom.io/react"
import { useSyncContinuity } from "atom.io/realtime-react"

import { asUUID } from "../library/as-uuid-web"
import { env } from "../library/env"
import { countAtom, countContinuity, incrementTX } from "../library/store"
import * as svg from "./<svg>"
import { authAtom } from "./main"

function App(): JSX.Element {
	const setView = useI(viewIntendedAtom)
	const view = useO(viewSelector)

	return (
		<>
			<div>
				<svg.tempest />
			</div>
			<div className="card">
				<button
					type="button"
					onClick={() => {
						setView(`login`)
					}}
				>
					Login
				</button>
				<button
					type="button"
					onClick={() => {
						setView(`signup`)
					}}
				>
					Sign Up
				</button>
				<button
					type="button"
					onClick={() => {
						setView(`game`)
					}}
				>
					Game
				</button>
			</div>
			{(() => {
				switch (view) {
					case `game`:
						return <Game />
					case `login`:
						return <Login />
					case `signup`:
						return <SignUp />
				}
			})()}
		</>
	)
}

export default App

const viewIntendedAtom = atom<`game` | `login` | `signup`>({
	key: `view`,
	default: `game`,
})
const myselfAtom = atom<{ username: string } | null>({
	key: `myself`,
	default: null,
})
const viewSelector = selector<`game` | `login` | `signup`>({
	key: `viewSelector`,
	get: ({ get }) => {
		const myself = get(myselfAtom)
		if (myself) {
			return `game`
		}
		return get(viewIntendedAtom)
	},
})

export function Game(): JSX.Element {
	const count = useO(countAtom)
	const increment = runTransaction(incrementTX)
	useSyncContinuity(countContinuity)
	return (
		<div className="card">
			<button
				type="button"
				onClick={() => {
					increment()
				}}
			>
				count is {count}
			</button>
			<p>Let's see how high we can count!</p>
		</div>
	)
}

export function Login(): JSX.Element {
	const setUsername = useI(usernameInputAtom)
	const setPassword = useI(password0InputAtom)
	const username = useO(usernameInputAtom)
	const password = useO(password0InputAtom)
	return (
		<div className="card">
			<input
				type="text"
				value={username}
				onChange={(e) => {
					setUsername(e.target.value)
				}}
			/>
			<input
				type="password"
				value={password}
				onChange={(e) => {
					setPassword(e.target.value)
				}}
			/>
			<button
				type="button"
				onClick={async () => {
					const signInUUID = await asUUID(`login`)
					const response = await fetch(
						`${env.VITE_BACKEND_ORIGIN}/login-${signInUUID}`,
						{
							method: `POST`,
							body: JSON.stringify({ username, password }),
						},
					)
					if (response.status === 201) {
						setUsername(``)
						setPassword(``)
						setState(viewIntendedAtom, `game`)
						const responseText = await response.text()
						const [user, sessionKey] = responseText.split(` `)
						setState(authAtom, { username, sessionKey })
					}
				}}
			>
				Login
			</button>
		</div>
	)
}

const usernameInputAtom = atom<string>({
	key: `username`,
	default: ``,
})
const password0InputAtom = atom<string>({
	key: `password0`,
	default: ``,
})
const password1InputAtom = atom<string>({
	key: `password1`,
	default: ``,
})
const emailInputAtom = atom<string>({
	key: `email`,
	default: ``,
})

export function SignUp(): JSX.Element {
	const setUsername = useI(usernameInputAtom)
	const setPassword0 = useI(password0InputAtom)
	const setPassword1 = useI(password1InputAtom)
	const setEmail = useI(emailInputAtom)
	const username = useO(usernameInputAtom)
	const password0 = useO(password0InputAtom)
	const password1 = useO(password1InputAtom)
	const email = useO(emailInputAtom)
	return (
		<div className="card">
			<input
				type="text"
				value={username}
				onChange={(e) => {
					setUsername(e.target.value)
				}}
			/>
			<input
				type="password"
				value={password0}
				onChange={(e) => {
					setPassword0(e.target.value)
				}}
			/>
			<input
				type="password"
				value={password1}
				onChange={(e) => {
					setPassword1(e.target.value)
				}}
			/>
			<input
				type="email"
				value={email}
				onChange={(e) => {
					setEmail(e.target.value)
				}}
			/>
			<button
				type="button"
				onClick={async () => {
					const password = password0
					const signUpUUID = await asUUID(`signup`)
					const response = await fetch(
						`${env.VITE_BACKEND_ORIGIN}/signup-${signUpUUID}`,
						{
							method: `POST`,
							body: JSON.stringify({ username, password, email }),
						},
					)
					if (response.status === 200) {
						setPassword1(``)
						setEmail(``)
						setState(viewIntendedAtom, `game`)
					}
				}}
			>
				Sign Up
			</button>
		</div>
	)
}
