import type { WritableToken } from "atom.io"
import { atom, getState, selector, setState } from "atom.io"
import * as React from "react"
import type { Tree, TreePath } from "treetrunks"
import { optional } from "treetrunks"

import { authAtom, emailInputAtom } from "../../services/socket-auth-service"

export const buttonBlockActiveAtom = atom<boolean>({
	key: `buttonBlockActive`,
	default: false,
})

export const ACCOUNT_EDITING_STATES = optional({
	username: null,
	email: optional({
		otcLogin: optional({
			otcVerify: null,
		}),
		passwordLogin: optional({
			otcVerify: null,
		}),
	}),
	"new-password": optional({
		otcVerify: null,
	}),
}) satisfies Tree
export type AccountEditingState = TreePath<typeof ACCOUNT_EDITING_STATES>

export type AccountString = `email` | `new-password` | `username`
export type AccountConfirmationField = `otcLogin` | `otcVerify` | `passwordLogin`
export const accountEditingAtom = atom<AccountEditingState>({
	key: `accountEditing`,
	default: [],
	effects: [
		({ onSet }) => {
			onSet(({ newValue }) => {
				switch (newValue[0]) {
					case `email`: {
						getState(emailInputElementAtom)?.focus()
						break
					}
					case `new-password`: {
						getState(passwordInputElementAtom)?.focus()
						break
					}
					case `username`: {
						getState(usernameInputElementAtom)?.focus()
						break
					}
					case undefined: {
						break
					}
				}
			})
		},
	],
})

export const emailInputElementAtom = atom<HTMLInputElement | null>({
	key: `emailInputElement`,
	default: null,
})
export const passwordInputElementAtom = atom<HTMLInputElement | null>({
	key: `passwordInputElement`,
	default: null,
})
export const usernameInputElementAtom = atom<HTMLInputElement | null>({
	key: `usernameInputElement`,
	default: null,
})
export function useElement<T extends HTMLElement>(
	token: WritableToken<T | null>,
): React.RefObject<T> {
	const ref = React.useRef<T | null>(null)
	React.useEffect(() => {
		setState(token, ref.current)
	}, [token])
	return ref as React.RefObject<T>
}

export const otcLoginFieldLabelSelector = selector<string>({
	key: `otcLoginFieldLabel`,
	get: ({ get }) => {
		const auth = get(authAtom)
		if (!auth) return ``
		return `Code sent to ${auth.email}`
	},
})
export const otcVerifyFieldLabelSelector = selector<string>({
	key: `otcVerifyFieldLabel`,
	get: ({ get }) => {
		const email = get(emailInputAtom)
		if (!email) return ``
		return `Code sent to ${email}`
	},
})
