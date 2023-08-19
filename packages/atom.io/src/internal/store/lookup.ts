import type { Store } from "../.."
import type {
	AtomToken,
	ReadonlySelectorToken,
	SelectorToken,
} from "../../../dist"
import { target } from "../transaction"

export function lookup(
	key: string,
	store: Store,
): AtomToken<unknown> | ReadonlySelectorToken<unknown> | SelectorToken<unknown> {
	const core = target(store)
	const type = core.atoms.has(key)
		? `atom`
		: core.selectors.has(key)
		? `selector`
		: `readonly_selector`
	return { key, type } as any
}
