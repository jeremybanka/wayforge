import type { AtomToken } from "atom.io"
import type { Store } from "atom.io/internal"
import { disposeAtom } from "atom.io/internal"
import type { Json } from "atom.io/json"

export function useConcealState(store: Store) {
	return (concealed: AtomToken<Json.Serializable>[]): void => {
		for (const token of concealed) {
			disposeAtom(store, token)
		}
	}
}
