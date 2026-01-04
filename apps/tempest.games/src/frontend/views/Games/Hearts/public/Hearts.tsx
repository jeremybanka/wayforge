import { useO } from "atom.io/react"

import { deckIndex, trickIndex } from "../../../../../library/topdeck"
import type { HeartsInteriorProps } from "../../Hearts"
import { Deck } from "../game-pieces/Deck"
import { Trick } from "../game-pieces/Trick"
import scss from "./Hearts.module.scss"

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
	const deckId = [...useO(deckIndex)][0]
	return deckId ? <Deck id={deckId} /> : null
}
function CurrentTrick({ roomKey }: HeartsInteriorProps): React.ReactNode | null {
	const trickId = [...useO(trickIndex)][0]
	return trickId ? <Trick id={trickId} gameId={roomKey} /> : null
}
