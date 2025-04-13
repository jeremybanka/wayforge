import type { ArkErrors } from "arktype"
import { type } from "arktype"
import { atom, getState, selector, setState } from "atom.io"
import { io } from "socket.io-client"

import {
	emailType,
	passwordType,
	usernameType,
} from "../../library/data-constraints.ts"
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

export const usernameInputAtom = atom<string>({
	key: `username`,
	default: window.localStorage.getItem(`username`) ?? ``,
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
		const parsed = passwordType.pipe(type(`"${password0}"`))(password1)
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
