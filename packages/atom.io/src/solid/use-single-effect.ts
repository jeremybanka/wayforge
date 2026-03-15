/** biome-ignore-all lint/correctness/useHookAtTopLevel: intentional */

import { isFn } from "atom.io/internal"
import { createEffect, on, onCleanup } from "solid-js"

export function useSingleEffect(
	effect: () => (() => void) | undefined | void,
	deps: unknown[],
): void {
	let cleanupFn: (() => void) | void
	createEffect(
		on(
			() => deps,
			() => {
				if (isFn(cleanupFn)) cleanupFn()
				cleanupFn = effect()
			},
			{ defer: false },
		),
	)
	onCleanup(() => {
		if (isFn(cleanupFn)) cleanupFn()
	})
}
