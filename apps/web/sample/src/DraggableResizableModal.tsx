import type { FC } from "react"
import { useRef, useState } from "react"

import styled from "@emotion/styled"
import type { DragHandlers } from "framer-motion"
import { motion } from "framer-motion"

const Modal = styled(motion.div)`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 16px;
  position: absolute;
`

const TitleBar = styled.div`
  width: 100%;
  height: 24px;
  background-color: #f0f0f0;
  border-radius: 4px 4px 0 0;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: move;
`

const ResizeHandle = styled.div`
  width: 16px;
  height: 16px;
  background-color: #ccc;
  border-radius: 50%;
  position: absolute;
  bottom: -8px;
  right: -8px;
  cursor: nwse-resize;
`

export const DraggableResizableModal: FC = () => {
	const [resizeActive, setResizeActive] = useState(false)
	const currentCornerRef = useRef({ x: 0, y: 0 })
	const getCorner = (x: 0 | 1, y: 0 | 1) => ({
		x: x * window.innerWidth,
		y: y * window.innerHeight,
	})

	const handleDrag: DragHandlers[`onDrag`] = (_, info) => {
		const { offset } = info
		const { innerWidth, innerHeight } = window

		const nearestCorner = {
			x: offset.x + (offset.x < innerWidth / 2 ? 0 : innerWidth),
			y: offset.y + (offset.y < innerHeight / 2 ? 0 : innerHeight),
		}

		console.log(nearestCorner)
	}

	const handleDragEnd: DragHandlers[`onDragEnd`] = (_, info) => {
		if (!resizeActive) {
			const { offset } = info
			const { innerWidth, innerHeight } = window

			// info.point.x = nearestCorner.x - info.point.x
			// info.point.y = nearestCorner.y - info.point.y
		}
	}
	return (
		<Modal
			drag
			dragElastic={0.5}
			onDrag={(e, info) => handleDrag(e, info)}
			onDragEnd={(e, info) => handleDragEnd(e, info)}
			dragConstraints={{ top: 0, left: 0, bottom: 0, right: 0 }}
			dragMomentum={false}
		>
			<TitleBar onPointerDown={() => setResizeActive(false)} />
			<p>Modal content</p>
			<ResizeHandle onPointerDown={() => setResizeActive(true)} />
		</Modal>
	)
}
