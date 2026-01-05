import { makeMouseHandlers } from "hamr/react-click-handlers"
import * as React from "react"

import type { RadialAction, RadialMode } from "."

export const composeUseRadial =
	(
		setActions: (newActions: RadialAction[]) => void,
		getRadialMode: () => RadialMode,
		setRadialMode: (newMode: RadialMode) => void,
		setMousePosition?: (newPosition: { x: number; y: number }) => void,
	) =>
	(
		actions: RadialAction[],
	): {
		onMouseEnter: () => void
		onMouseLeave: () => void
		onMouseMove: () => void
		onClick: React.MouseEventHandler
		onMouseDown: React.MouseEventHandler
		onMouseUp: React.MouseEventHandler
		onContextMenu: React.MouseEventHandler
		onTouchStart: React.TouchEventHandler
		onTouchEnd: React.TouchEventHandler
	} => {
		const mouseHasMoved = React.useRef(false)
		return {
			onMouseEnter: () => {
				if (getRadialMode() === `idle`) {
					setActions(actions)
				}
			},
			onMouseLeave: () => {
				if (getRadialMode() === `idle`) {
					setActions([])
				}
			},
			onMouseMove: () => (mouseHasMoved.current = true),
			...makeMouseHandlers({
				onMouseDownR: () => {
					console.log(`mouse down`)
					mouseHasMoved.current = false
					setTimeout(() => (mouseHasMoved.current = true), 333)
					setRadialMode(`held`)
				},
				onMouseUpR: () => {
					if (mouseHasMoved.current) {
						setRadialMode(`idle`)
					} else {
						setRadialMode(`open`)
					}
				},
			}),
			onTouchStart: (event) => {
				const mousePosition = {
					x: event.touches[0].clientX,
					y: event.touches[0].clientY,
				}
				setMousePosition?.({
					x: event.touches[0].clientX,
					y: event.touches[0].clientY,
				})
				setRadialMode(`held`)
				setActions(actions)
				console.log(`touch start`, mousePosition)
			},
			onTouchEnd: (event) => {
				const mousePosition = {
					x: event.changedTouches[0].clientX,
					y: event.changedTouches[0].clientY,
				}
				setMousePosition?.(mousePosition)
				setRadialMode(`open`)
			},
		}
	}
