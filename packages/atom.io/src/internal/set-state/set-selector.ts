import type { WritableSelectorToken } from "atom.io"

import type { Store } from "../store"
import { withdraw } from "../store"

export function setSelector<T>(
	target: Store,
	token: WritableSelectorToken<T>,
	value: T | ((oldValue: T) => T),
): void {
	const selector = withdraw(target, token)
	selector.set(value)
}
