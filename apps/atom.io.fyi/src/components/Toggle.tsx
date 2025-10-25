import { Button } from "./ToggleButton"

export type ToggleProps = {
	children: string
	checked: boolean
	onChange: () => void
}

export const Toggle = { Button }
