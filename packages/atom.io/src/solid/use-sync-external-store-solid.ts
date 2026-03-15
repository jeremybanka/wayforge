import { createEffect, createSignal, onCleanup } from "solid-js"

export function useSyncExternalStore<Snapshot>(
	subscribe: (onStoreChange: () => void) => () => void,
	getSnapshot: () => Snapshot,
): () => Snapshot {
	const [state, setState] = createSignal<Snapshot>(getSnapshot(), {
		equals: false,
	})

	createEffect(() => {
		const update = () => setState(() => getSnapshot())
		const unsubscribe = subscribe(update)

		update()

		onCleanup(() => {
			unsubscribe()
		})
	})

	return () => {
		state()
		return getSnapshot()
	}
}
