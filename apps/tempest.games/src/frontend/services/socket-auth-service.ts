import type { ArkErrors } from "arktype"
import { type } from "arktype"
import type { Loadable } from "atom.io"
import { atom, getState, selector, setState, subscribe } from "atom.io"
import { io, Socket } from "socket.io-client"

import {
	emailType,
	passwordType,
	usernameType,
} from "../../library/data-constraints.ts"
import { env } from "../../library/env.ts"
import { trpc } from "./trpc-client-service.ts"
import {
	TempestSocketDown,
	TempestSocketUp,
} from "../../library/socket-interface.ts"

export const socket: Socket<TempestSocketDown, TempestSocketUp> = io(
	env.VITE_BACKEND_ORIGIN,
	{
		auth: (pass) => {
			const auth = getState(authAtom)
			if (auth) {
				pass(auth)
			}
		},
		autoConnect: false,
	},
)
socket
	.on(`connect`, () => {
		console.log(`connected`)
	})
	.on(`connect_error`, () => {
		console.log(`connect_error`)
		setState(authAtom, null)
	})
	.on(`usernameChanged`, (username) => {
		setState(authAtom, (auth) => (auth === null ? null : { ...auth, username }))
	})

export const authAtom = atom<{
	email: string
	username: string
	password: boolean
	sessionKey: string
	verification: `unverified` | `verified`
} | null>({
	key: `auth`,
	default: () => {
		const email = localStorage.getItem(`email`)
		const username = localStorage.getItem(`username`)
		const password = localStorage.getItem(`password`) === `1`
		const sessionKey = localStorage.getItem(`sessionKey`)
		const verification = localStorage.getItem(`verification`)
		if (email && username && sessionKey && verification) {
			if (verification === `verified` || verification === `unverified`) {
				return { email, username, password, sessionKey, verification }
			}
		}
		return null
	},
	effects: [
		({ onSet }) => {
			onSet(async ({ newValue }) => {
				console.log(`setting auth`, newValue)
				if (newValue) {
					console.log(`setting auth`, newValue)
					localStorage.setItem(`email`, newValue.email)
					localStorage.setItem(`username`, newValue.username)
					localStorage.setItem(`password`, `${+newValue.password}`)
					localStorage.setItem(`sessionKey`, newValue.sessionKey)
					localStorage.setItem(`verification`, newValue.verification)
					console.log(`connecting...`)
					if (newValue.verification === `verified`) {
						socket.connect()
					} else {
						await import(`./router-service.ts`).then(({ navigate }) => {
							navigate(`/verify`)
						})
					}
				} else {
					console.log(`clearing session...`)
					localStorage.removeItem(`sessionKey`)
				}
			})
		},
		({ setSelf }) => {
			const email = localStorage.getItem(`email`)
			const username = localStorage.getItem(`username`)
			const password = localStorage.getItem(`password`) === `1`
			const sessionKey = localStorage.getItem(`sessionKey`)
			const verification = localStorage.getItem(`verification`)
			if (email && username && sessionKey && verification) {
				if (verification === `verified` || verification === `unverified`) {
					setSelf({ email, username, password, sessionKey, verification })
				}
			}
		},
	],
})
export const usernameInputAtom = atom<string>({
	key: `username`,
	default: window.localStorage.getItem(`username`) ?? ``,
})
export const usernameQueryReadyAtom = atom<boolean>({
	key: `usernameDebounce`,
	default: true,
})
export const usernameDebounced100msAtom = atom<string | null>({
	key: `usernameDebounced100ms`,
	default: window.localStorage.getItem(`username`) ?? ``,
	effects: [
		({ setSelf }) => {
			subscribe(usernameInputAtom, () => {
				if (getState(usernameQueryReadyAtom)) {
					setSelf(getState(usernameInputAtom))
					setState(usernameQueryReadyAtom, false)
					setTimeout(() => {
						setState(usernameQueryReadyAtom, true)
						setSelf(getState(usernameInputAtom))
					}, 2000)
				}
			})
		},
	],
})
export const isUsernameTakenQuerySelector = selector<Loadable<boolean>>({
	key: `isUsernameTakenQuery`,
	get: async ({ get }) => {
		const username = get(usernameDebounced100msAtom)
		if (!username) return false
		const auth = getState(authAtom)
		if (username === auth?.username) return false
		return trpc.isUsernameTaken.query({ username })
	},
})
export const usernameIssuesSelector = selector<ArkErrors | null>({
	key: `usernameIssues`,
	get: ({ get }) => {
		const username = get(usernameInputAtom)
		const parsed = usernameType(username)
		if (parsed instanceof type.errors) {
			return parsed
		}
		return null
	},
})
export const password0InputAtom = atom<string>({
	key: `password0`,
	default: ``,
})
export const password0IssuesSelector = selector<ArkErrors | null>({
	key: `password0Issues`,
	get: ({ get }) => {
		const password0 = get(password0InputAtom)
		const parsed = passwordType(password0)
		if (parsed instanceof type.errors) {
			return parsed
		}
		return null
	},
})
export const password1InputAtom = atom<string>({
	key: `password1`,
	default: ``,
})
export const password1IssuesSelector = selector<ArkErrors | null>({
	key: `password1Issues`,
	get: ({ get }) => {
		const password0 = get(password0InputAtom)
		const password1 = get(password1InputAtom)
		const parsed = type(`"${password0}"`)(password1)
		if (parsed instanceof type.errors) {
			return parsed
		}
		return null
	},
})
export const emailInputAtom = atom<string>({
	key: `email`,
	default: ``,
})
export const emailIssuesSelector = selector<ArkErrors | null>({
	key: `emailIssues`,
	get: ({ get }) => {
		const email = get(emailInputAtom)
		const parsed = emailType(email)
		if (parsed instanceof type.errors) {
			return parsed
		}
		return null
	},
})
export const signUpReadySelector = selector<boolean>({
	key: `signupReady`,
	get: ({ get }) => {
		const usernameIssues = get(usernameIssuesSelector)
		const password0Issues = get(password0IssuesSelector)
		const password1Issues = get(password1IssuesSelector)
		const emailIssues = get(emailIssuesSelector)
		return !(usernameIssues ?? password0Issues ?? password1Issues ?? emailIssues)
	},
})

export const oneTimeCodeInputAtom = atom<string>({
	key: `oneTimeCode`,
	default: ``,
})
