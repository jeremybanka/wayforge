import { ToggleProps } from "./Toggle"
import label from "./Toggle.Button.module.scss"

export const setCssVars = (
	vars: Record<`--${string}`, number | string>,
): Partial<React.CSSProperties> => vars as any

export function Button({
	children,
	checked,
	onChange,
}: ToggleProps): JSX.Element {
	return (
		<label
			className={label.class}
			style={setCssVars({
				"--width": "40px",
				"--height": "40px",
			})}
		>
			<input type="checkbox" checked={checked} onChange={onChange} />
			<div />
			<span>{children}</span>
		</label>
	)
}
