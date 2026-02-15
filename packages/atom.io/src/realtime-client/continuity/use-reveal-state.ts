import { setIntoStore, type Store } from "atom.io/internal"
import type { Json } from "atom.io/json"

export function createRevealState(store: Store) {
	return (revealed: Json.Array): void => {
		let i = 0
		let k: any
		let v: any
		for (const x of revealed) {
			if (i % 2 === 0) {
				k = x
			} else {
				v = x
				setIntoStore(store, k, v)
			}
			i++
		}
	}
}
