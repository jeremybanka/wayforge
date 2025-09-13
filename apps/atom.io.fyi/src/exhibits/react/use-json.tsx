import { mutableAtom } from "atom.io"
import { useJSON } from "atom.io/react"
import { SetRTX } from "../../../../../packages/atom.io/dist/transceivers/u-list/set-rtx"

const numbersCollectionState = mutableAtom<SetRTX<string>>({
	key: `numbersCollection::mutable`,
	class: SetRTX,
})

export const Numbers: React.FC = () => {
	const numbers = useJSON(numbersCollectionState)
	return (
		<>
			{numbers.members.map((n) => (
				<div key={n}>{n}</div>
			))}
		</>
	)
}
