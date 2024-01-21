import * as React from "react"

const { NODE_ENV } = process.env
const IN_DEV = NODE_ENV === `development` || NODE_ENV === `test`

function noop() {}

export function useSingleEffect(
	effect: () => (() => void) | undefined,
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
