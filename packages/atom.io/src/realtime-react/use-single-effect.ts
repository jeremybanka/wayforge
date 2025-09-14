/** biome-ignore-all lint/correctness/useHookAtTopLevel: intentional */

import { isFn } from "atom.io/internal"
import * as React from "react"

export function useSingleEffect(
	effect: () => (() => void) | undefined | void,
	deps: unknown[],
): void {
	const globalEnv = (globalThis as unknown as { env: any })[`env`]
	const isInDev = globalEnv?.NODE_ENV === `development`
	if (isInDev) {
		const cleanupRef = React.useRef<boolean | (() => void)>(false)
		React.useEffect(() => {
			let cleanupFn = cleanupRef.current
			if (cleanupFn === false) {
				cleanupFn = effect() ?? true
				cleanupRef.current = cleanupFn
			} else {
				return () => {
					if (isFn(cleanupFn)) cleanupFn()
					cleanupRef.current = false
				}
			}
		}, deps)
	} else {
		React.useEffect(effect, deps)
	}
}
