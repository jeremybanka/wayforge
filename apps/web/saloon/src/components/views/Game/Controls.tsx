import { useO } from "atom.io/react"
import { myIdState } from "atom.io/realtime-client"
import { useServerAction } from "atom.io/realtime-react"
import { nanoid } from "nanoid"
import type { FC } from "react"

import { addHandTx, spawnClassicDeckTX } from "~/apps/node/lodge/src/store/game"

import { button } from "../../containers/<button>"

export const Controls: FC = () => {
	const myId = useO(myIdState)
	const addHand = useServerAction(addHandTx)
	const spawnClassicDeck = useServerAction(spawnClassicDeckTX)
	return (
		<controls>
			<h>Controls</h>
			{myId ? (
				<button.ff onClick={() => addHand(myId, nanoid())}>Add Hand</button.ff>
			) : null}
			<button.ff
				onClick={() => {
					const deckId = `DECK_ID_TEST` // nanoid()
					const cardIds = Array.from({ length: 52 }).map(nanoid)
					spawnClassicDeck(deckId, cardIds)
				}}
			>
				Add Deck
			</button.ff>
		</controls>
	)
}
