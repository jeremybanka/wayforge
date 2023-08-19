import type { Store } from "./store"
import type { AtomToken, ReadonlySelectorToken, SelectorToken } from "../.."
import { target } from "../transaction"

export function lookup(
	key: string,
	store: Store,
): AtomToken<unknown> | ReadonlySelectorToken<unknown> | SelectorToken<unknown> {
	const core = target(store)
	let type: string = core.atoms.has(key)
		? `atom`
		: core.selectors.has(key)
		? `selector`
		: core.readonlySelectors.has(key)
		? `readonly_selector`
		: ``
	if (!type) {
		const errorId = Math.random().toString(36)
		type = `🚨 This state could not be found by lookup! Check the console for "${errorId}"`
		store.config.logger?.error(
			`${errorId}: Key "${key}" does not exist in the store.`,
		)
	}
	return { key, type } as any
}
