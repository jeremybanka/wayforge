import { useO } from "atom.io/react"
import { myIdState } from "atom.io/realtime-client"
import { useServerAction } from "atom.io/realtime-react"
import { nanoid } from "nanoid"
import type { FC } from "react"

import { addHandTx, spawnClassicDeckTX } from "~/apps/node/lodge/src/store/game"

import { button } from "src/components/<button>"

export const Controls: FC = () => {
	const myId = useO(myIdState)
	const addHand = useServerAction(addHandTx)
	const spawnClassicDeck = useServerAction(spawnClassicDeckTX)
	return (
		<span>
			<h1>Controls</h1>
			{myId ? (
				<button.ff
					onClick={() => addHand({ playerId: myId, groupId: nanoid() })}
				>
					Add Hand
				</button.ff>
			) : null}
			<button.ff
				onClick={() => {
					const deckId = `DECK_ID_TEST` // nanoid()
					const cardIds = Array.from({ length: 52 }).map(() => nanoid())
					spawnClassicDeck(deckId, cardIds)
				}}
			>
				Add Deck
			</button.ff>
		</span>
	)
}
