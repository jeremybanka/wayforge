import type * as AtomIO from "atom.io"
import type { Store } from "atom.io/internal"
import type { Socket } from "atom.io/realtime"

import { pullSelectorRoots } from "./pull-selector-roots"

export function pullSelector<T>(
	store: Store,
	socket: Socket,
	token: AtomIO.SelectorToken<T>,
): () => void {
	return pullSelectorRoots(store, socket, token)
}
