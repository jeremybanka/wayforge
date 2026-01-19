import { useO } from "atom.io/react"

import {
	deckKeysAtom,
	trickKeysAtom,
} from "../../../../../library/game-systems/card-game-stores"
import type { HeartsInteriorProps } from "../../Hearts"
import { Deck } from "../game-pieces/Deck"
import { Trick } from "../game-pieces/Trick"
import scss from "./HeartsBoard.module.scss"

export function Hearts({ roomKey }: HeartsInteriorProps): React.ReactNode {
	return (
		<article className={scss[`class`]}>
			<section data-css="deck">
				<GameDeck />
			</section>
			<section data-css="trick">
				<CurrentTrick roomKey={roomKey} />
			</section>
		</article>
	)
}
function GameDeck(): React.ReactNode | null {
	const deckId = [...useO(deckKeysAtom)][0]
	return deckId ? <Deck id={deckId} /> : null
}
function CurrentTrick({ roomKey }: HeartsInteriorProps): React.ReactNode | null {
	const trickId = [...useO(trickKeysAtom)][0]
	return trickId ? <Trick id={trickId} gameId={roomKey} /> : null
}
