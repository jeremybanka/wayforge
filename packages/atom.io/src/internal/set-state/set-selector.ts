import type { WritableSelectorToken } from "atom.io"

import type { OpenOperation } from "../operation"
import type { Store } from "../store"
import { withdraw } from "../store"

export function setSelector<T>(
	target: Store & { operation: OpenOperation<any> },
	token: WritableSelectorToken<T>,
	value: T | ((oldValue: T) => T),
): void {
	const selector = withdraw(target, token)
	selector.setInto(target, value)
}
