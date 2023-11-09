import { atom } from "atom.io"
import { useI, useO } from "atom.io/react"

const toggleState = atom<boolean>({
	key: `toggle`,
	default: false,
})

export const UrlDisplay: React.FC = () => {
	const setToggle = useI(toggleState)
	const toggle = useO(toggleState)
	return (
		<input
			type="checkbox"
			checked={toggle}
			onChange={() => setToggle((t) => !t)}
		/>
	)
}
