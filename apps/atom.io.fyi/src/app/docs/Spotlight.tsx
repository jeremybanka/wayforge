"use client"

import * as React from "react"

export type ElementPosition = Pick<DOMRect, `height` | `left` | `top` | `width`>
export type SpotlightProps = {
	elementId: string | null
	startingPosition?: ElementPosition
	padding?: number
	updateSignals?: any[]
}
export function Spotlight({
	elementId,
	startingPosition = {
		top: 0,
		left: 0,
		width: 0,
		height: 0,
	},
	padding = 0,
	updateSignals = [],
}: SpotlightProps): JSX.Element | null {
	const [position, setPosition] = React.useState(startingPosition)
	React.useEffect(() => {
		if (!elementId) {
			setPosition(startingPosition)
			return
		}
		const element = document.getElementById(elementId)
		if (element) {
			const updatePosition = () => {
				const e = document.getElementById(elementId)
				if (!e) {
					return
				}
				const boundingRect = e.getBoundingClientRect()
				setPosition(boundingRect)
			}
			element.addEventListener(``, updatePosition)
			updatePosition()
			addEventListener(`resize`, updatePosition)
			return () => {
				removeEventListener(`resize`, updatePosition)
				element.removeEventListener(`resize`, updatePosition)
			}
		}
		setPosition(startingPosition)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [elementId, ...updateSignals])
	return position.width === 0 ? null : (
		<data
			style={{
				position: `fixed`,
				top: position.top - padding,
				left: position.left - padding,
				width: position.width + padding * 2,
				height: position.height + padding * 2,
			}}
		/>
	)
}
