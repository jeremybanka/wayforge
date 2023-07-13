import type { MouseEventHandler } from "react"

export type MakeMouseHandlers = (
	a: Partial<
		Record<
			| `onClickL`
			| `onClickM`
			| `onClickR`
			| `onMouseDownL`
			| `onMouseDownM`
			| `onMouseDownR`
			| `onMouseUpL`
			| `onMouseUpM`
			| `onMouseUpR`,
			MouseEventHandler
		>
	>,
) => {
	onClick: MouseEventHandler
	onMouseDown: MouseEventHandler
	onMouseUp: MouseEventHandler
	onContextMenu: MouseEventHandler
}

export const makeMouseHandlers: MakeMouseHandlers = ({
	onClickL,
	onClickM,
	onClickR,
	onMouseDownL,
	onMouseDownM,
	onMouseDownR,
	onMouseUpL,
	onMouseUpM,
	onMouseUpR,
}) => ({
	onClick: (e) => [onClickL, onClickM, onClickR][e.button]?.(e),
	onMouseDown: (e) => [onMouseDownL, onMouseDownM, onMouseDownR][e.button]?.(e),
	onMouseUp: (e) => [onMouseUpL, onMouseUpM, onMouseUpR][e.button]?.(e),
	onContextMenu: (e) => e.preventDefault(),
})
