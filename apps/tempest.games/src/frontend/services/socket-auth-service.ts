import { atom, getState, selector, setState } from "atom.io"
import { io } from "socket.io-client"
import { z, type ZodIssue } from "zod"

import {
	emailSchema,
	passwordSchema,
	usernameSchema,
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
export const usernameIssuesSelector = selector<ZodIssue[] | null>({
	key: `usernameIssues`,
	get: ({ get }) => {
		const username = get(usernameInputAtom)
		const parsed = usernameSchema.safeParse(username)
		if (parsed.success) {
			return null
		}
		return parsed.error.issues
	},
})
export const password0InputAtom = atom<string>({
	key: `password0`,
	default: ``,
})
export const password0IssuesSelector = selector<ZodIssue[] | null>({
	key: `password0Issues`,
	get: ({ get }) => {
		const password0 = get(password0InputAtom)
		const parsed = passwordSchema.safeParse(password0)
		if (parsed.success) {
			return null
		}
		return parsed.error.issues
	},
})
export const password1InputAtom = atom<string>({
	key: `password1`,
	default: ``,
})
export const password1IssuesSelector = selector<ZodIssue[] | null>({
	key: `password1Issues`,
	get: ({ get }) => {
		const password0 = get(password0InputAtom)
		const password1 = get(password1InputAtom)
		const parsed = z
			.string()
			.refine((pwd) => pwd === password0, {
				message: `Passwords do not match.`,
			})
			.safeParse(password1)
		if (parsed.success) {
			return null
		}
		return parsed.error.issues
	},
})
export const emailInputAtom = atom<string>({
	key: `email`,
	default: ``,
})
export const emailIssuesSelector = selector<ZodIssue[] | null>({
	key: `emailIssues`,
	get: ({ get }) => {
		const email = get(emailInputAtom)
		const parsed = emailSchema.safeParse(email)
		if (parsed.success) {
			return null
		}
		return parsed.error.issues
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
