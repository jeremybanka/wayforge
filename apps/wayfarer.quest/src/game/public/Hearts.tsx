import { useO } from "atom.io/react"

import { publicDeckIndex } from "wayfarer.quest/services/store/public-deck-index"
import { publicTrickIndex } from "wayfarer.quest/services/store/public-trick-index"
import type { GameProps } from "../Game"
import { Deck } from "../game-pieces/Deck"
import { Trick } from "../game-pieces/Trick"

import scss from "./Hearts.module.scss"

export function Hearts({ roomId }: GameProps): JSX.Element {
	return (
		<article className={scss.class}>
			<section data-css="deck">
				<GameDeck />
			</section>
			<section data-css="trick">
				<CurrentTrick roomId={roomId} />
			</section>
		</article>
	)
}
function GameDeck(): JSX.Element | null {
	const deckId = useO(publicDeckIndex)[0]
	return deckId ? <Deck id={deckId} /> : null
}
function CurrentTrick({ roomId }: GameProps): JSX.Element | null {
	const trickId = useO(publicTrickIndex)[0]
	return trickId ? <Trick id={trickId} gameId={roomId} /> : null
}
