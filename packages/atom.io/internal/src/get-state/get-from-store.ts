import type { ReadableToken } from "atom.io"

import type { Store } from "../store"
import { withdraw } from "../store"
import { readOrComputeValue } from "./read-or-compute-value"

export function getFromStore<T>(token: ReadableToken<T>, store: Store): T {
	const state = withdraw(token, store)
	return readOrComputeValue(state, store)
}
