import type { RegularAtomToken, WritableToken } from "atom.io"
import { atom, getState, setState } from "atom.io"
import * as React from "react"

export const buttonBlockActiveAtom = atom<boolean>({
	key: `buttonBlockActive`,
	default: false,
})

export type AccountString = `email` | `password` | `username`
export const editingAtom = atom<AccountString | null>({
	key: `editing`,
	default: null,
	effects: [
		({ onSet }) => {
			onSet(({ newValue }) => {
				switch (newValue) {
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
					case null: {
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
