import type { WritableToken } from "atom.io"
import { atom, getState, setState } from "atom.io"
import * as React from "react"
import type { Tree, TreePath } from "treetrunks"
import { optional, required } from "treetrunks"

export const buttonBlockActiveAtom = atom<boolean>({
	key: `buttonBlockActive`,
	default: false,
})

export const ACCOUNT_EDITING_STATES = optional({
	username: null,
	email: optional({
		"one-time code to confirm email": null,
	}),
	password: required({
		"one-time code to reset password": null,
	}),
}) satisfies Tree
export type AccountEditingState = TreePath<typeof ACCOUNT_EDITING_STATES>

export type AccountString = `email` | `password` | `username`
export const accountEditingAtom = atom<AccountEditingState>({
	key: `editing`,
	default: [],
	effects: [
		({ onSet }) => {
			onSet(({ newValue }) => {
				switch (newValue[0]) {
					case `email`: {
						getState(emailInputElementAtom)?.focus()
						break
					}
					case `password`: {
						getState(password0InputElementAtom)?.focus()
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
export const password0InputElementAtom = atom<HTMLInputElement | null>({
	key: `password0InputElement`,
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
