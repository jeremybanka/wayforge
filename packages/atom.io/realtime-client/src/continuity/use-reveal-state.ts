import type { Store } from "atom.io/internal"
import type { Json } from "atom.io/json"

import { upsertState } from "./upsert-state"

export function useRevealState(store: Store, continuityKey: string) {
	return (revealed: Json.Array): void => {
		let i = 0
		let k: any
		let v: any
		for (const x of revealed) {
			if (i % 2 === 0) {
				k = x
			} else {
				v = x
				upsertState(store, continuityKey, k, v)
			}
			i++
		}
	}
}
