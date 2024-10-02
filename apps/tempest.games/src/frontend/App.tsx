import "./App.css"

import { atom, runTransaction, selector, setState } from "atom.io"
import { useI, useO } from "atom.io/react"
import { useSyncContinuity } from "atom.io/realtime-react"
import { useState } from "react"

import { asUUID } from "../library/as-uuid-web"
import { env } from "../library/env"
import { countAtom, countContinuity, incrementTX } from "../library/store"
import * as svg from "./<svg>"

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
	const setUsername = useI(usernameInputState)
	const setPassword = useI(password0InputState)
	const username = useO(usernameInputState)
	const password = useO(password0InputState)
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
					if (response.status === 204) {
						setState(viewIntendedAtom, `game`)
					}
				}}
			>
				Login
			</button>
		</div>
	)
}

const usernameInputState = atom<string>({
	key: `username`,
	default: ``,
})
const password0InputState = atom<string>({
	key: `password0`,
	default: ``,
})
const password1InputState = atom<string>({
	key: `password1`,
	default: ``,
})
const emailInputState = atom<string>({
	key: `email`,
	default: ``,
})

export function SignUp(): JSX.Element {
	const setUsername = useI(usernameInputState)
	const setPassword0 = useI(password0InputState)
	const setPassword1 = useI(password1InputState)
	const setEmail = useI(emailInputState)
	const username = useO(usernameInputState)
	const password0 = useO(password0InputState)
	const password1 = useO(password1InputState)
	const email = useO(emailInputState)
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
