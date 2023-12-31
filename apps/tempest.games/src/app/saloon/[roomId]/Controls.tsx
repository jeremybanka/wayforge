import { useO } from "atom.io/react"
import { myIdState } from "atom.io/realtime-client"
import { useServerAction } from "atom.io/realtime-react"
import { nanoid } from "nanoid"
import type { FC } from "react"

import { addHandTx, spawnClassicDeckTX } from "~/apps/node/lodge/src/store/game"

import { button } from "src/components/<button>"

import comic from "src/components/comic.module.scss"

export const Controls: FC = () => {
	const myId = useO(myIdState)
	const addHand = useServerAction(addHandTx)
	const spawnClassicDeck = useServerAction(spawnClassicDeckTX)
	return (
		<span>
			{myId ? (
				<button.curledLeft
					className={comic.class}
					onClick={() => {
						const groupId = nanoid()
						addHand(myId, groupId)
					}}
				>
					Add Hand
				</button.curledLeft>
			) : null}
			<button.curledLeft
				className={comic.class}
				onClick={() => {
					const deckId = nanoid()
					const cardIds = Array.from({ length: 52 }).map(() => nanoid())
					spawnClassicDeck(deckId, cardIds)
				}}
			>
				Add Deck
			</button.curledLeft>
		</span>
	)
}
