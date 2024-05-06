import type { ReadableToken } from "atom.io"

import type { Store } from "../store"
import { withdrawOrCreate } from "../store"
import { readOrComputeValue } from "./read-or-compute-value"

export function getFromStore<T>(token: ReadableToken<T>, store: Store): T {
	const state = withdrawOrCreate(token, store)
	return readOrComputeValue(state, store)
}
