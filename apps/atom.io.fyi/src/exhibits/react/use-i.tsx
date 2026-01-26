import { atom } from "atom.io"
import { useI, useO } from "atom.io/react"

const toggleAtom = atom<boolean>({
	key: `toggle`,
	default: false,
})

function UrlDisplay() {
	const setToggle = useI(toggleAtom)
	const toggle = useO(toggleAtom)
	return (
		<input
			type="checkbox"
			checked={toggle}
			onChange={() => {
				setToggle((t) => !t)
			}}
		/>
	)
}
