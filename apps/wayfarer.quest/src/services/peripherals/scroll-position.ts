import * as AtomIO from "atom.io"
import type { Point2d } from "corners"
import * as React from "react"

const emitTimes = new Map<string, number>()
const throttleTime = 50 // milliseconds

export const windowScrollPositionState = AtomIO.atom<Point2d>({
	key: `windowScrollPosition`,
	default: { x: 0, y: 0 },
	effects: [
		({ setSelf }) => {
			if (typeof window !== `undefined`) {
				const scrollListener = () => {
					const now = performance.now()
					const lastEmitTime = emitTimes.get(`$window`) || 0
					if (now - lastEmitTime > throttleTime) {
						emitTimes.set(`$window`, now)
						setSelf({ x: window.scrollX, y: window.scrollY })
					}
				}
				window.addEventListener(`scroll`, scrollListener)
				return () => {
					window.removeEventListener(`scroll`, scrollListener)
				}
			}
		},
	],
})

export const findScrollPositionState = AtomIO.atomFamily<Point2d, string>({
	key: `scrollPosition`,
	default: { x: 0, y: 0 },
})

export const useScrollPosition = <T extends HTMLElement>(
	key: string,
): React.MutableRefObject<T | null> => {
	const nodeRef = React.useRef<T | null>(null)
	const capturedRef = React.useRef<T | null>(null)

	React.useEffect(() => {
		if (nodeRef.current) {
			capturedRef.current = nodeRef.current
			const scrollListener = () => {
				if (!capturedRef.current) return
				const now = performance.now()
				const lastEmitTime = emitTimes.get(key) || 0
				if (now - lastEmitTime > throttleTime) {
					emitTimes.set(key, now)
					const { scrollLeft, scrollTop } = capturedRef.current
					const scrollPositionState = findScrollPositionState(key)
					AtomIO.setState(scrollPositionState, { x: scrollLeft, y: scrollTop })
				}
			}

			nodeRef.current.addEventListener(`scroll`, scrollListener)
			return () => {
				if (!capturedRef.current) return
				capturedRef.current.removeEventListener(`scroll`, scrollListener)
			}
		}
	}, [key])

	return nodeRef
}
