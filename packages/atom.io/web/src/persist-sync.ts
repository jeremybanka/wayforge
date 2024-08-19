import type { AtomEffect } from "atom.io"

export type StringInterface<T> = {
	stringify: (t: T) => string
	parse: (s: string) => T
}

export const persistSync =
	<T>(storage: Storage) =>
	({ stringify, parse }: StringInterface<T>) =>
	(key: string): AtomEffect<T> =>
	({ setSelf, onSet }) => {
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
