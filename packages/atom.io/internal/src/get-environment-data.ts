import type { Store } from "./store"

export type EnvironmentData = {
	window: typeof window | undefined
	global: typeof global | undefined
	store: Store
}

export function getEnvironmentData(store: Store): EnvironmentData {
	return {
		window: typeof window === `undefined` ? undefined : window,
		global: typeof global === `undefined` ? undefined : global,
		store,
	}
}
