import type { Modify } from "atom.io/internal"
import type { FC } from "react"

export const OpenClose: FC<{
	isOpen: boolean
	setIsOpen: (next: Modify<boolean> | boolean) => void
	disabled?: boolean
}> = ({ isOpen, setIsOpen, disabled }) => {
	return (
		<button
			type="button"
			className={`carat ${isOpen ? `open` : `closed`}`}
			onClick={() => setIsOpen((isOpen) => !isOpen)}
			disabled={disabled}
		>
			▶
		</button>
	)
}

export const button = {
	OpenClose,
}
