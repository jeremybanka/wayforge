import { atom } from "atom.io"
import { useI, useO } from "atom.io/react"
const productSearchQueryAtom = atom<string>({
	key: `productSearchQuery`,
	default: ``,
})

export function ProductSearch() {
	const query = useO(productSearchQueryAtom)
	const setQuery = useI(productSearchQueryAtom)
	const normalizedQuery = query.trim().toLowerCase()
	const searchLabel = normalizedQuery || `everything`

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
