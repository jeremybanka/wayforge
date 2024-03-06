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
