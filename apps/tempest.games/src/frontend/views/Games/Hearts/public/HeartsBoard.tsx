import { useO } from "atom.io/react"

import { deckKeysAtom } from "~library/game-systems/card-game-state"
import { trickKeysAtom } from "~library/game-systems/trick-taker-game-state"

import { Deck } from "../game-pieces/Deck"
import { Trick } from "../game-pieces/Trick"
import scss from "./HeartsBoard.module.scss"

export function Hearts(): React.ReactNode {
	return (
		<article className={scss[`class`]}>
			<section data-css="deck">
				<GameDeck />
			</section>
			<section data-css="trick">
				<CurrentTrick />
			</section>
		</article>
	)
}
function GameDeck(): React.ReactNode | null {
	const deckId = [...useO(deckKeysAtom)][0]
	return deckId ? <Deck key={deckId} /> : null
}
function CurrentTrick(): React.ReactNode | null {
	const trickId = [...useO(trickKeysAtom)][0]
	return trickId ? <Trick key={trickId} /> : null
}
