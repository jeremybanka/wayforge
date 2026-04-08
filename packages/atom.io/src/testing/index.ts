import type { RootStore, StoreConfig } from "atom.io/internal"
import { IMPLICIT, Store } from "atom.io/internal"

export type AfterEach = (callback: () => void) => unknown

/**
 * Rebuild the implicit store after each test while preserving the states that
 * were installed at setup time.
 */
export function resetImplicitStore(afterEach: AfterEach): void {
	const implicitStore = IMPLICIT.STORE
	const config: StoreConfig = implicitStore.config
	const template = new Store(config, implicitStore)
	afterEach(() => {
		globalThis.ATOM_IO_IMPLICIT_STORE = new Store(config, template) as RootStore
	})
}
