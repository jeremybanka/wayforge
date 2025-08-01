import { runTransaction } from "atom.io"
import { useO } from "atom.io/react"
import { myIdState } from "atom.io/realtime-client"
import {
	spawnClassicDeckTX,
	spawnHandTX,
} from "core.wayfarer.quest/src/store/game"
import { nanoid } from "nanoid"
import type { FC } from "react"
import { button } from "wayfarer.quest/components/<button>"
import comic from "wayfarer.quest/components/comic.module.scss"
import { myRoomKeyState } from "wayfarer.quest/services/store/my-room"

import scss from "./Controls.module.scss"

export const Controls: FC = () => {
	const myId = useO(myIdState)
	const myRoomId = useO(myRoomKeyState)
	const spawnHand = runTransaction(spawnHandTX)
	const spawnClassicDeck = runTransaction(spawnClassicDeckTX)
	return (
		<span className={scss[`class`]}>
			{myId ? (
				<button.curledLeft
					className={comic[`class`]}
					onClick={() => {
						const groupId = nanoid(5)
						spawnHand(myId, groupId)
					}}
				>
					Add Hand
				</button.curledLeft>
			) : null}
			<button.curledLeft
				className={comic[`class`]}
				onClick={() => {
					if (myRoomId) {
						const deckId = nanoid(5)
						const cardIds = Array.from({ length: 52 }).map(() => nanoid(5))
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
