import { mutableAtom } from "atom.io"
import { useJSON } from "atom.io/react"
import { SetRTX } from "atom.io/transceivers/set-rtx"

const numbersCollectionState = mutableAtom({
	key: `numbersCollection::mutable`,
	class: SetRTX<string>,
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
