import "./App.css"

import { atom, selector } from "atom.io"
import { useI, useO } from "atom.io/react"

import * as svg from "./<svg>"
import { authAtom } from "./services/socket-auth"
import { Game } from "./views/Game"
import { Login } from "./views/Login"
import { SignUp } from "./views/SignUp"

export const viewIntendedAtom = atom<`game` | `login` | `sign-up`>({
	key: `view`,
	default: `login`,
})
export const viewSelector = selector<`game` | `login` | `sign-up`>({
	key: `viewSelector`,
	get: ({ get }) => {
		const auth = get(authAtom)
		if (auth) {
			return `game`
		}
		return get(viewIntendedAtom)
	},
})

export function App(): JSX.Element {
	const setViewIntended = useI(viewIntendedAtom)
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
						setViewIntended(`login`)
					}}
				>
					Login
				</button>
				<button
					type="button"
					onClick={() => {
						setViewIntended(`sign-up`)
					}}
				>
					Sign Up
				</button>
				<button
					type="button"
					onClick={() => {
						setViewIntended(`game`)
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
					case `sign-up`:
						return <SignUp />
				}
			})()}
		</>
	)
}
