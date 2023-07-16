import { useO } from "atom.io/react"
import * as React from "react"

import { Deck } from "./Deck"
import { publicDeckIndex } from "./store/public-deck-index"

export const Public: React.FC = () => {
	const publicDeckIds = useO(publicDeckIndex)
	return (
		<div className="public-decks">
			<h4>Public Decks</h4>
			<div>
				{publicDeckIds.map((id) => (
					<Deck key={id} id={id} />
				))}
			</div>
		</div>
	)
}
