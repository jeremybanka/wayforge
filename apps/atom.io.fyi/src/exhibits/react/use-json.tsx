import { mutableAtom } from "atom.io"
import { useJSON } from "atom.io/react"
import { UList } from "atom.io/transceivers/u-list"

const numbersCollectionAtom = mutableAtom<UList<string>>({
	key: `numbersCollection`,
	class: UList,
})

function Numbers() {
	const numbers = useJSON(numbersCollectionAtom)
	return (
		<>
			{numbers.map((n) => (
				<div key={n}>{n}</div>
			))}
		</>
	)
}
