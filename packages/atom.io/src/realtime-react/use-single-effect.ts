/** biome-ignore-all lint/correctness/useHookAtTopLevel: intentional */

import * as React from "react"

// @ts-expect-error this is a safe way to check a property on the global object
const { NODE_ENV } = globalThis[`env`] ?? {}
const IN_DEV = NODE_ENV === `development`

function noop() {}

export function useSingleEffect(
	effect: () => (() => void) | undefined | void,
	deps: unknown[],
): void {
	if (IN_DEV) {
		const cleanup = React.useRef<() => void>(noop)
		React.useEffect(() => {
			let dispose = cleanup.current
			if (dispose === noop) {
				dispose = effect() ?? noop
				cleanup.current = dispose
			} else {
				return () => {
					dispose()
					cleanup.current = noop
				}
			}
		}, deps)
	} else {
		React.useEffect(effect, deps)
	}
}
