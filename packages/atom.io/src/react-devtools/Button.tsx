import type { Modify } from "atom.io/internal"
import type { FC } from "react"

export const OpenClose: FC<{
	isOpen: boolean
	setIsOpen: (next: Modify<boolean> | boolean) => void
	disabled?: boolean
	testid: string
}> = ({ isOpen, setIsOpen, disabled, testid }) => {
	return (
		<button
			type="button"
			data-testid={testid}
			className={`carat ${isOpen ? `open` : `closed`}`}
			onClick={() => {
				setIsOpen((prev) => !prev)
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
