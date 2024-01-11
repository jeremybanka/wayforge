import * as AtomIO from "atom.io"
import type { Point2d } from "corners"
import * as React from "react"

import { findScrollPositionState } from "./scroll-position"

let lastEmitTime = 0
const throttleTime = 50 // milliseconds

export const windowMousePositionState = AtomIO.atom<Point2d>({
	key: `windowMousePosition`,
	default: { x: 0, y: 0 },
	effects: [
		({ setSelf }) => {
			if (typeof window !== `undefined`) {
				const mouseListener = (event: MouseEvent) => {
					const now = Date.now()
					if (now - lastEmitTime > throttleTime) {
						lastEmitTime = now
						setSelf({ x: event.clientX, y: event.clientY })
					}
				}
				window.addEventListener(`mousemove`, mouseListener)
				return () => {
					window.removeEventListener(`mousemove`, mouseListener)
				}
			}
		},
	],
})

export const findMousePositionState = AtomIO.atomFamily<Point2d, string>({
	key: `mousePosition`,
	default: { x: 0, y: 0 },
})

export const findOffsetMouseSelector = AtomIO.selectorFamily<Point2d, string[]>({
	key: `offsetMouse`,
	get:
		([mousePosKey, ...scrollPosKeys]) =>
		({ get }) => {
			const mousePosition = get(findMousePositionState(mousePosKey))
			const offsets = scrollPosKeys.map((key) =>
				get(findScrollPositionState(key)),
			)
			const totalOffset = offsets.reduce((tally, offset) => ({
				x: tally.x + offset.x,
				y: tally.y + offset.y,
			}))
			const x = mousePosition.x + totalOffset.x
			const y = mousePosition.y + totalOffset.y
			return { x, y }
		},
})

export const useMousePosition = <T extends HTMLElement>(
	key: string,
): React.MutableRefObject<T | null> => {
	const nodeRef = React.useRef<T | null>(null)
	const debounceTimer = React.useRef<number | null>(null)

	React.useEffect(() => {
		const handleMouseMove = (event: MouseEvent) => {
			if (debounceTimer.current) {
				clearTimeout(debounceTimer.current)
			}
			debounceTimer.current = window.setTimeout(() => {
				const pos: Point2d = { x: event.clientX, y: event.clientY }
				AtomIO.setState(findMousePositionState(key), pos)
			}, 100) // debounce time
		}

		const currentElement = nodeRef.current
		if (currentElement) {
			currentElement.addEventListener(`mousemove`, handleMouseMove)
		}

		return () => {
			if (currentElement) {
				currentElement.removeEventListener(`mousemove`, handleMouseMove)
			}
			if (debounceTimer.current) {
				clearTimeout(debounceTimer.current)
			}
		}
	}, [key])

	return nodeRef
}
