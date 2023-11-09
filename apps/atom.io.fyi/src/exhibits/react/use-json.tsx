import { atom } from "atom.io"
import { useJSON } from "atom.io/react"
import { SetRTX } from "atom.io/transceivers/set-rtx"

const numbersCollectionState = atom<SetRTX<number>, number[]>({
	key: `numbersCollection::mutable`,
	mutable: true,
	default: () => new SetRTX([0]),
	toJson: (s) => [...s],
	fromJson: (a) => new SetRTX(a),
})

export const Numbers: React.FC = () => {
	const numbers = useJSON(numbersCollectionState)
	return (
		<>
			{numbers.map((n) => (
				<div key={n}>{n}</div>
			))}
		</>
	)
}
