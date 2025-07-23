import type { Modify } from "atom.io/internal"
import type { FC } from "react"

export const OpenClose: FC<{
	isOpen: boolean
	setIsOpen?: ((next: Modify<boolean> | boolean) => void) | undefined
	onShiftClick?: (
		event:
			| React.KeyboardEvent<HTMLButtonElement>
			| React.MouseEvent<HTMLButtonElement, MouseEvent>,
	) => boolean
	disabled?: boolean
	testid: string
}> = ({ isOpen, setIsOpen, onShiftClick, disabled, testid }) => {
	function fn(
		event:
			| React.KeyboardEvent<HTMLButtonElement>
			| React.MouseEvent<HTMLButtonElement, MouseEvent>,
	) {
		if (onShiftClick && event.shiftKey) {
			if (!onShiftClick(event)) {
				return
			}
		}
		setIsOpen?.((prev) => !prev)
	}
	return (
		<button
			type="button"
			data-testid={testid}
			className={`carat ${isOpen ? `open` : `closed`}`}
			onMouseDown={fn}
			onKeyDown={(event) => {
				switch (event.key) {
					case `Enter`:
					case ` `:
						fn(event)
						break
					default:
				}
			}}
			disabled={disabled}
		>
			<span className="json_editor_icon json_editor_carat">▶</span>
		</button>
	)
}

export const button: {
	OpenClose: typeof OpenClose
} = {
	OpenClose,
}
