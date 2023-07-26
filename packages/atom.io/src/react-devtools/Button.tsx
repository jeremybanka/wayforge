import type { FC } from "react"

import type { Modifier } from "~/packages/anvl/src/function"

export const OpenClose: FC<{
	isOpen: boolean
	setIsOpen: (next: Modifier<boolean> | boolean) => void
	disabled?: boolean
}> = ({ isOpen, setIsOpen, disabled }) => {
	return (
		<button
			type="button"
			className={isOpen ? `open` : `closed`}
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
