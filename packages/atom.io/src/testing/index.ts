import type { RootStore } from "atom.io/internal"
import { IMPLICIT, Store } from "atom.io/internal"

/**
 * A snapshot of the store state that can be restored.
 */
export type Snapshot = {
	restore(): void
	store: RootStore
}

/**
 * Capture the current store structure and return a function that restores it.
 */
export function takeSnapshot(store: RootStore = IMPLICIT.STORE): Snapshot {
	const baseConfig = IMPLICIT.STORE.config
	const templateConfig = { ...baseConfig, name: `TEMPLATE` }
	const template = new Store(templateConfig, store) as RootStore
	return {
		restore(): void {
			globalThis.ATOM_IO_IMPLICIT_STORE = new Store(
				baseConfig,
				template,
			) as RootStore
		},
		store: template,
	}
}
