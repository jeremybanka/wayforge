import { atom, getState, setState } from "atom.io"
import { io } from "socket.io-client"

import { env } from "../../library/env.ts"

export const socket = io(env.VITE_BACKEND_ORIGIN, {
	auth: (pass) => {
		const auth = getState(authAtom)
		if (auth) {
			pass(auth)
		}
	},
	autoConnect: false,
})
	.on(`connect`, () => {
		console.log(`connected`)
	})
	.on(`connect_error`, () => {
		console.log(`connect_error`)
		setState(authAtom, null)
	})

export const authAtom = atom<{ username: string; sessionKey: string } | null>({
	key: `auth`,
	default: null,
	effects: [
		({ onSet }) => {
			onSet(({ newValue }) => {
				if (newValue) {
					localStorage.setItem(`username`, newValue.username)
					localStorage.setItem(`sessionKey`, newValue.sessionKey)
					console.log(`connecting...`)
					socket.connect()
				} else {
					console.log(`clearing session...`)
					localStorage.removeItem(`sessionKey`)
				}
			})
		},
		({ setSelf }) => {
			const username = localStorage.getItem(`username`)
			const sessionKey = localStorage.getItem(`sessionKey`)
			if (username && sessionKey) {
				setSelf({ username, sessionKey })
			}
		},
	],
})
