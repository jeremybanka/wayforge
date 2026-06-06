import * as React from "react"
import type { JSX } from "react/jsx-runtime"

export function ProductSearch(): JSX.Element {
	const [query, setQuery] = React.useState(``)
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
