import * as AtomIO from "atom.io"
import type { Point2d } from "corners"
import * as React from "react"

let lastEmitTime = 0
const throttleTime = 50 // milliseconds

export const windowScrollPositionState = AtomIO.atom<Point2d>({
	key: `windowScrollPosition`,
	default: { x: 0, y: 0 },
	effects: [
		({ setSelf }) => {
			if (typeof window !== `undefined`) {
				const handleScroll = () => {
					const now = Date.now()
					if (now - lastEmitTime > throttleTime) {
						lastEmitTime = now
						setSelf({ x: window.scrollX, y: window.scrollY })
					}
				}
				const debouncedHandleScroll = (() => {
					let timeoutId: NodeJS.Timeout | null = null
					return () => {
						if (timeoutId) {
							clearTimeout(timeoutId)
						}
						timeoutId = setTimeout(handleScroll, 100)
					}
				})()
				window.addEventListener(`scroll`, debouncedHandleScroll)
				return () => {
					window.removeEventListener(`scroll`, debouncedHandleScroll)
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
	const effectCaptured = React.useRef<T | null>(null)

	React.useEffect(() => {
		if (nodeRef.current) {
			effectCaptured.current = nodeRef.current
			const handleScroll = () => {
				const pos: Point2d = {
					x: nodeRef.current?.scrollLeft || 0,
					y: nodeRef.current?.scrollTop || 0,
				}
				AtomIO.setState(findScrollPositionState(key), pos)
			}

			const debouncedHandleScroll = (() => {
				let timeoutId: NodeJS.Timeout | null = null
				return () => {
					if (timeoutId) {
						clearTimeout(timeoutId)
					}
					timeoutId = setTimeout(handleScroll, 100)
				}
			})()

			nodeRef.current.addEventListener(`scroll`, debouncedHandleScroll)

			return () => {
				if (effectCaptured.current) {
					effectCaptured.current.removeEventListener(
						`scroll`,
						debouncedHandleScroll,
					)
				}
			}
		}
	}, [key])

	return nodeRef
}
