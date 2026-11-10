import type { Accessor } from "@atom.io/spa"
import { onCleanup, useGetter, useId, useSetter, useStore } from "@atom.io/spa"
import type { MutableAtomToken, Setter, ViewOf } from "atom.io"
import type { Transceiver } from "atom.io/internal"
import { createRegularAtom, disposeFromStore } from "atom.io/internal"

/** Component-owned state. Its atom is removed with the owning SPA instance. */
export function useLocalState<T>(
	initial: T,
): readonly [Accessor<ViewOf<T>>, (next: T | Setter<T>) => void] {
	const store = useStore()
	const token = createRegularAtom<T, never, never>(
		store,
		{ key: `tempest:view:${useId()}`, default: initial },
		undefined,
	)
	onCleanup(() => {
		disposeFromStore(store, token)
	})
	return [useGetter(token), useSetter(token)] as const
}

/** Snapshot a mutable collection inside a tracked JSX expression. */
export function useMutable<T extends Transceiver<any, any, any>>(
	token: MutableAtomToken<T>,
): Accessor<(T extends Iterable<infer Item> ? Item : never)[]> {
	const getValue = useGetter(token)
	return () =>
		Array.from(
			getValue() as Iterable<T extends Iterable<infer Item> ? Item : never>,
		)
}
