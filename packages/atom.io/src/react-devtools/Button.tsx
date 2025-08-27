import type { FC } from "react"

export const OpenClose: FC<{
	isOpen: boolean
	setIsOpen?:
		| ((next: boolean | ((prev: boolean) => boolean)) => void)
		| undefined
	onShiftClick?: (
		event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
	) => boolean
	disabled?: boolean
	testid: string
}> = ({ isOpen, setIsOpen, onShiftClick, disabled, testid }) => {
	return (
		<button
			type="button"
			data-testid={testid}
			className={`carat ${isOpen ? `open` : `closed`}`}
			onClick={(event) => {
				if (onShiftClick && event.shiftKey) {
					if (!onShiftClick(event)) {
						return
					}
				}
				setIsOpen?.((prev) => !prev)
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
