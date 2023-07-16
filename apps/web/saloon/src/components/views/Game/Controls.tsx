
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
			<button.flashFire
				onClick={() =>
					myId ? addHand({ playerId: myId, groupId: nanoid() }) : null
				}
			>
				Add Hand
			</button.flashFire>
			<button.flashFire
				onClick={() =>
					spawnClassicDeck(nanoid(), Array.from({ length: 52 }).map(nanoid))
				}
			>
				Add Classic Deck
			</button.flashFire>
		</div>
	)
}
