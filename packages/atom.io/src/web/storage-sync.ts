import type { AtomEffect, ViewOf } from "atom.io"

export type StringInterface<T> = {
	stringify: (t: ViewOf<T>) => string
	parse: (s: string) => T
}

export const storageSync =
	<T>(
		storage: Storage | undefined,
		{ stringify, parse }: StringInterface<T>,
		key: string,
	): AtomEffect<T> =>
	({ setSelf, onSet }) => {
		if (!storage) {
			return
		}
		const savedValue = storage.getItem(key)
		if (savedValue != null) setSelf(parse(savedValue))

		onSet(({ newValue }) => {
			if (newValue == null) {
				storage.removeItem(key)
				return
			}
			storage.setItem(key, stringify(newValue))
		})
	}
