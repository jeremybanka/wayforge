import type { appRouter } from "@backend/trpc-app-router.ts"
import { TRPCClientError } from "@trpc/client"
import type { ArkErrors } from "arktype"
import { type } from "arktype"
import type { Loadable } from "atom.io"
import { atom, getState, selector, setState, subscribe } from "atom.io"
import { parseJson, stringifyJson } from "atom.io/json"
import { storageSync } from "atom.io/web"
import type { Socket } from "socket.io-client"
import { io } from "socket.io-client"

import type { ClientAuthData } from "../../library/data-constraints.ts"
import {
	clientAuthDataType,
	emailType,
	passwordType,
	usernameType,
} from "../../library/data-constraints.ts"
import { env } from "../../library/env.ts"
import type {
	TempestSocketDown,
	TempestSocketUp,
} from "../../library/socket-interface.ts"
import { navigate } from "./router-service.ts"
import { trpcClient } from "./trpc-client-service.ts"

export type ClientError = TRPCClientError<typeof appRouter>

export const socket: Socket<TempestSocketDown, TempestSocketUp> = io(
	env.VITE_BACKEND_ORIGIN,
	{
		auth: (pass) => {
			const auth = getState(authAtom)
			if (auth) {
				pass(auth)
			}
		},
		withCredentials: true,
		autoConnect: false,
	},
)
socket
	.on(`connect`, () => {
		console.log(`connected`)
		setState(connectionErrorAtom, null)
	})
	.on(`connect_error`, (error) => {
		console.log(`connect_error`, error)
		if (error.message.includes(`Handshake failed validation`)) {
			setState(authAtom, null)
		} else {
			setState(connectionErrorAtom, error.message)
		}
	})
	.on(`usernameChanged`, (username) => {
		setState(authAtom, (auth) => (auth === null ? null : { ...auth, username }))
	})

export const connectionErrorAtom = atom<string | null>({
	key: `connectionError`,
	default: null,
})

export const authAtom = atom<ClientAuthData | null>({
	key: `auth`,
	default: function loadSavedAuth() {
		const stored: string | null = localStorage.getItem(`auth`)
		if (stored) {
			try {
				const parsed = parseJson(stored)
				const auth = clientAuthDataType(parsed)
				if (auth instanceof type.errors) {
					console.error(`failed to parse auth data`, auth)
					return null
				}
				if (auth.verification === `verified`) {
					console.log(`connecting...`)
					socket.connect()
				}
				return auth
			} catch (thrown) {
				console.error(`failed to parse auth data`, thrown)
				return null
			}
		}
		return null
	},
	effects: [
		function saveAuth({ onSet }) {
			onSet(({ newValue }) => {
				console.log(`setting auth`, newValue)
				if (newValue) {
					console.log(`setting auth`, newValue)
					setState(usernameInputAtom, newValue.username)
					localStorage.setItem(`auth`, stringifyJson(newValue))
					if (newValue.verification === `verified`) {
						console.log(`connecting...`)
						socket.connect()
					} else {
						navigate(`/verify`)
					}
				} else {
					console.log(`clearing session...`)
					localStorage.removeItem(`auth`)
				}
			})
		},
	],
})
export const usernameInputAtom = atom<string>({
	key: `usernameInput`,
	default: getState(authAtom)?.username ?? ``,
})
export const usernameQueryReadyAtom = atom<boolean>({
	key: `usernameQueryReady`,
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
export const isUsernameTakenQuerySelector = selector<
	Loadable<boolean>,
	ClientError
>({
	key: `isUsernameTakenQuery`,
	get: ({ get }) => {
		const username = get(usernameDebounced100msAtom)
		if (!username) return false
		const auth = getState(authAtom)
		if (username === auth?.username) return false
		const usernameIssues = getState(usernameIssuesSelector)
		if (usernameIssues instanceof type.errors) return false
		return trpcClient.isUsernameTaken.query({ username })
	},
	catch: [TRPCClientError],
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
export const passwordInputAtom = atom<string>({
	key: `passwordInput`,
	default: ``,
})
export const passwordIssuesSelector = selector<ArkErrors | null>({
	key: `passwordIssues`,
	get: ({ get }) => {
		const password0 = get(passwordInputAtom)
		const parsed = passwordType(password0)
		if (parsed instanceof type.errors) {
			return parsed
		}
		return null
	},
})
export const emailInputAtom = atom<string>({
	key: `emailInput`,
	default: ``,
	effects: [storageSync(localStorage, JSON, `email`)],
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
	key: `signUpReady`,
	get: ({ get }) => {
		const usernameIssues = get(usernameIssuesSelector)
		const password0Issues = get(passwordIssuesSelector)
		const emailIssues = get(emailIssuesSelector)
		return !(usernameIssues ?? password0Issues ?? emailIssues)
	},
})

export const oneTimeCodeInputAtom = atom<string>({
	key: `oneTimeCodeInput`,
	default: ``,
})
export const oneTimeCodeNewEmailInputAtom = atom<string>({
	key: `oneTimeCodeNewEmailInput`,
	default: ``,
})

export const authTargetAtom = atom<string | null>({
	key: `authTarget`,
	default: null,
})
