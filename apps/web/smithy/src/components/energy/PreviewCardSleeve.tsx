import type { FC, ReactNode } from "react"

import { setCssVars } from "~/packages/hamr/react-css-vars/src"

import scss from "./PreviewCardSleeve.module.scss"

export const Slot_PreviewCardSleeve: FC<{
	children: ReactNode
	hex: string
}> = ({ children, hex }) => (
	<slot
		className={scss.class}
		style={setCssVars({
			"--sleeve-background": hex,
		})}
	>
		{children}
		<span className="sleeve-bg" />
	</slot>
)
