import * as React from "react"

export function onMount(
	effect: () => (() => void) | undefined,
	deps?: any[],
): void {
	if (process.env.NODE_ENV === `development`) {
		const cleanup = React.useRef<(() => void) | undefined>()
		React.useEffect(() => {
			let dispose = cleanup.current
			if (dispose) {
				return () => {
					dispose?.()
					cleanup.current = undefined
				}
			}
			dispose = effect()
			cleanup.current = dispose
		}, deps)
	} else {
		React.useEffect(effect, deps)
	}
}
