import "./ToggleButton.css"

import type { VNode } from "preact"
import * as React from "react"

import type { ToggleProps } from "./Toggle"

export const setCssVars = (
	vars: Record<`--${string}`, number | string>,
): Partial<React.CSSProperties> => vars

export function Button({ children, checked, onChange }: ToggleProps): VNode {
	return (
		<label
			className="toggle-button"
			style={setCssVars({
				"--width": `40px`,
				"--height": `40px`,
			})}
		>
			<input type="checkbox" checked={checked} onChange={onChange} />
			<div />
			<span>{children}</span>
		</label>
	)
}
