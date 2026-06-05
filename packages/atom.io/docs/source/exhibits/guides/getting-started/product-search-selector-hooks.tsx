import { atom, selector } from "atom.io"
import { useI, useO } from "atom.io/react"

const productSearchQueryAtom = atom<string>({
	key: `productSearchQuery`,
	default: ``,
})

const productSearchLabelSelector = selector<string>({
	key: `productSearchLabel`,
	get: ({ get }) => {
		const query = get(productSearchQueryAtom)
		const normalizedQuery = query.trim().toLowerCase()
		return normalizedQuery || `everything`
	},
})

export function ProductSearch() {
	const query = useO(productSearchQueryAtom)
	const setQuery = useI(productSearchQueryAtom)
	const searchLabel = useO(productSearchLabelSelector)

	return (
		<section>
			<label htmlFor="product-search">Search products</label>
			<input
				id="product-search"
				value={query}
				onChange={(event) => {
					setQuery(event.currentTarget.value)
				}}
			/>
			<p>Searching for: {searchLabel}</p>
		</section>
	)
}
