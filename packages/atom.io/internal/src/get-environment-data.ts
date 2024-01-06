import type { Store } from "./store"

export type EnvironmentData = {
	runtime: `browser` | `node` | `unknown`
	store: Store
}

export function getEnvironmentData(store: Store): EnvironmentData {
	return {
		runtime:
			typeof window === `undefined`
				? typeof global === `object`
					? `node`
					: `unknown`
				: `browser`,
		store,
	}
}
