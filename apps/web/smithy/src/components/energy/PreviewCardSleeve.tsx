import type { FC, ReactNode } from "react"

import { setCssVars } from "~/packages/hamr/src/react-css-vars"

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
