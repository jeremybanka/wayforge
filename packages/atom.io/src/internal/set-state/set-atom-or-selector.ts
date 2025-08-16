import type { WritableToken } from "atom.io"

import type { OpenOperation } from "../operation"
import type { Store } from "../store"
import { setAtom } from "./set-atom"
import { setSelector } from "./set-selector"

export const setAtomOrSelector = <T>(
	store: Store & { operation: OpenOperation },
	token: WritableToken<T>,
	value: T | ((oldValue: T) => T),
): void => {
	switch (token.type) {
		case `atom`:
		case `mutable_atom`:
			setAtom(store, token, value)
			break
		case `writable_pure_selector`:
		case `writable_held_selector`:
			setSelector(store, token, value)
			break
	}
}
