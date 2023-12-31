import { useO } from "atom.io/react"
import * as React from "react"
import { h3 } from "src/components/<hX>"

import { publicDeckIndex } from "src/services/store/public-deck-index"
import { Controls } from "./Controls"
import { Deck } from "./Deck"

import scss from "./Public.module.scss"

export const Public: React.FC = () => {
	const publicDeckIds = useO(publicDeckIndex)
	return (
		<div className={scss.class}>
			<h3.Trapezoid>Game</h3.Trapezoid>
			<main>
				{publicDeckIds.map((id) => (
					<Deck key={id} id={id} />
				))}
				<Controls />
			</main>
		</div>
	)
}
