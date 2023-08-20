import type { AtomEffect } from "atom.io"
import type { Json } from "atom.io/json"

export type StringInterface<T> = {
	stringify: (t: T) => string
	parse: (s: string) => T
}

export const persistAtom =
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

export const lazyLocalStorageEffect: <J extends Json.Serializable>(
	key: string,
) => AtomEffect<J> = persistAtom(localStorage)(JSON)
