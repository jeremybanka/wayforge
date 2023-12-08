import { Button } from "./Toggle.Button"

export type ToggleProps = {
	children: string
	checked: boolean
	onChange: () => void
}

export const Toggle = { Button }
