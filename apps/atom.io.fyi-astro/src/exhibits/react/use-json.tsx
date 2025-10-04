import { mutableAtom } from "atom.io"
import { useJSON } from "atom.io/react"
import { UList } from "atom.io/transceivers/u-list"

const numbersCollectionState = mutableAtom<UList<string>>({
	key: `numbersCollection::mutable`,
	class: UList,
})

function Numbers() {
	const numbers = useJSON(numbersCollectionState)
	return (
		<>
			{numbers.map((n) => (
				<div key={n}>{n}</div>
			))}
		</>
	)
}
