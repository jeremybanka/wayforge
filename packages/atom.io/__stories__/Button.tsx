import "./button.css"

import type { ReactNode } from "react"

/* eslint-disable quotes */
export interface ButtonProps {
	/** Is this the principal call to action on the page? */
	primary?: boolean
	/** What background color to use */
	backgroundColor?: string
	/** How large should the button be? */
	size?: "large" | "medium" | "small"
	/** Button contents */
	label: string
	/** Optional click handler */
	onClick?: (() => void) | undefined
}
/* eslint-enable quotes */

/** Primary UI component for user interaction */
export const Button = ({
	primary = false,
	size = `medium`,
	backgroundColor,
	label,
	...props
}: ButtonProps): ReactNode => {
	const mode = primary
		? `storybook-button--primary`
		: `storybook-button--secondary`
	return (
		<button
			type="button"
			className={[`storybook-button`, `storybook-button--${size}`, mode].join(
				` `,
			)}
			style={{ backgroundColor }}
			{...props}
		>
			{label}
		</button>
	)
}
