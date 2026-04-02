import type { AtomEffect } from "atom.io"

import type { StringInterface } from "./storage-sync"

export const searchParamSync =
	<T>({ stringify, parse }: StringInterface<T>, key: string): AtomEffect<T> =>
	({ setSelf, onSet }) => {
		if (
			typeof window === `undefined` ||
			typeof window.location === `undefined` ||
			typeof window.history === `undefined`
		) {
			return
		}

		const savedValue = new URLSearchParams(window.location.search).get(key)
		if (savedValue != null) setSelf(parse(savedValue))

		onSet(({ newValue }) => {
			const url = new URL(window.location.href)
			if (newValue == null) {
				url.searchParams.delete(key)
			} else {
				url.searchParams.set(key, stringify(newValue))
			}
			window.history.replaceState(window.history.state, ``, url)
		})
	}
