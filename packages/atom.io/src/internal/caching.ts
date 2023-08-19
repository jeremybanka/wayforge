import type { Store } from "./store"
import { IMPLICIT } from "./store"
import { target } from "./transaction"

export const cacheValue = (
	key: string,
	value: unknown,
	store: Store = IMPLICIT.STORE,
): void => {
	target(store).valueMap.set(key, value)
}

export const readCachedValue = <T>(
	key: string,
	store: Store = IMPLICIT.STORE,
): T => target(store).valueMap.get(key)

export const isValueCached = (
	key: string,
	store: Store = IMPLICIT.STORE,
): boolean => target(store).valueMap.has(key)
