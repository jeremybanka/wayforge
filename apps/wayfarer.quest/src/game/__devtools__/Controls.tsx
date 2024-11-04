import { runTransaction } from "atom.io"
import { useO } from "atom.io/react"
import { myIdState } from "atom.io/realtime-client"
import { nanoid } from "nanoid"
import type { FC } from "react"
import { button } from "wayfarer.quest/components/<button>"
import comic from "wayfarer.quest/components/comic.module.scss"
import { myRoomKeyState } from "wayfarer.quest/services/store/my-room"

import { spawnClassicDeckTX } from "~/apps/core.wayfarer.quest/src/store/game/card-game-actions/spawn-classic-deck"
import { spawnHandTX } from "~/apps/core.wayfarer.quest/src/store/game/card-game-actions/spawn-hand"
import type { CardKey } from "~/apps/core.wayfarer.quest/src/store/game/card-game-stores/cards-store"

import scss from "./Controls.module.scss"

export const Controls: FC = () => {
	const myId = useO(myIdState)
	const myRoomId = useO(myRoomKeyState)
	const spawnHand = runTransaction(spawnHandTX)
	const spawnClassicDeck = runTransaction(spawnClassicDeckTX)
	return (
		<span className={scss.class}>
			{myId ? (
				<button.curledLeft
					className={comic.class}
					onClick={() => {
						const groupId = `card_group:hand::${nanoid(5)}` as const
						spawnHand(myId, groupId)
					}}
				>
					Add Hand
				</button.curledLeft>
			) : null}
			<button.curledLeft
				className={comic.class}
				onClick={() => {
					if (myRoomId) {
						const deckId = `card_group:deck::${nanoid(5)}` as const
						const cardIds = Array.from({ length: 52 }).map<CardKey>(
							() => `card::$$${nanoid(5)}$$`,
						)
						spawnClassicDeck(deckId, cardIds)
					} else {
						console.error(`Tried to spawn a deck without being in a room.`)
					}
				}}
			>
				Add Deck
			</button.curledLeft>
		</span>
	)
}
