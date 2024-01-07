import { useO } from "atom.io/react"
import { myIdState } from "atom.io/realtime-client"
import { useServerAction } from "atom.io/realtime-react"
import { nanoid } from "nanoid"
import type { FC } from "react"

import { addHandTX, spawnClassicDeckTX } from "~/apps/node/lodge/src/store/game"

import { button } from "../../containers/<button>"

export const Controls: FC = () => {
	const myId = useO(myIdState)
	const myRoomId = useO(myIdState)
	const addHand = useServerAction(addHandTX)
	const spawnClassicDeck = useServerAction(spawnClassicDeckTX)
	return (
		<controls>
			<h>Controls</h>
			{myId ? (
				<button.ff onClick={() => addHand(myId, nanoid())}>Add Hand</button.ff>
			) : null}
			<button.ff
				onClick={() => {
					if (myRoomId) {
						const deckId = `DECK_ID_TEST` // nanoid()
						const cardIds = Array.from({ length: 52 }).map(nanoid)
						spawnClassicDeck(myRoomId, deckId, cardIds)
					} else {
						console.error(`Tried to spawn a deck without being in a room.`)
					}
				}}
			>
				Add Deck
			</button.ff>
		</controls>
	)
}
