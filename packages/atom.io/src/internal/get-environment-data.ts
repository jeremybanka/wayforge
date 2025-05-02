import type { Store } from "./store"

export type EnvironmentData = {
	store: Store
}

export function getEnvironmentData(store: Store): EnvironmentData {
	return {
		store,
	}
}
