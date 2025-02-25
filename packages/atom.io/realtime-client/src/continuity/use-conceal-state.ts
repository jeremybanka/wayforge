import type { AtomToken } from "atom.io"
import type { Store } from "atom.io/internal"
import { disposeAtom } from "atom.io/internal"

export function useConcealState(store: Store) {
	return (concealed: AtomToken<unknown>[]): void => {
		for (const token of concealed) {
			disposeAtom(store, token)
		}
	}
}
