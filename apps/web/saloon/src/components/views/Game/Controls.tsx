import { useO } from "atom.io/react"
import { myIdState, useServerAction } from "atom.io/realtime-react"
import { nanoid } from "nanoid"
import type { FC } from "react"

import { addHandTx, spawnClassicDeckTX } from "~/apps/node/lodge/src/store/game"

import { button } from "../../containers/<button>"

export const Controls: FC = () => {
	const myId = useO(myIdState)
	const addHand = useServerAction(addHandTx)
	const spawnClassicDeck = useServerAction(spawnClassicDeckTX)
	return (
		<div className="controls">
			<h4>Controls</h4>
			{myId ? (
				<button.ff
					onClick={() => addHand({ playerId: myId, groupId: nanoid() })}
				>
					Add Hand
				</button.ff>
			) : null}
			<button.ff
				onClick={() => {
					const deckId = nanoid()
					const cardIds = Array.from({ length: 52 }).map(nanoid)
					spawnClassicDeck(deckId, cardIds)
				}}
			>
				Add Classic Deck
			</button.ff>
		</div>
	)
}
