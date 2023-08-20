import { become } from "~/packages/anvl/src/function"

import { getState__INTERNAL } from "../get-state-internal"
import type { Selector } from "../selector"
import type { Store } from "../store"
import { IMPLICIT } from "../store"

export const setSelectorState = <T>(
	selector: Selector<T>,
	next: T | ((oldValue: T) => T),
	store: Store = IMPLICIT.STORE,
): void => {
	const oldValue = getState__INTERNAL(selector, store)
	const newValue = become(next)(oldValue)

	store.config.logger?.info(`<< setting selector "${selector.key}" to`, newValue)
	store.config.logger?.info(`   || propagating change made to "${selector.key}"`)

	selector.set(newValue)
}
