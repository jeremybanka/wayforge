import { useO } from "atom.io/react"
import { myIdState } from "atom.io/realtime-client"
import { useServerAction } from "atom.io/realtime-react"
import { nanoid } from "nanoid"
import type { FC } from "react"

import {
	spawnClassicDeckTX,
	spawnHandTX,
} from "~/apps/node/lodge/src/store/game"

import { button } from "wayfarer.quest/components/<button>"
import { myRoomKeyState } from "wayfarer.quest/services/store/my-room"

import comic from "wayfarer.quest/components/comic.module.scss"
import scss from "./Controls.module.scss"

export const Controls: FC = () => {
	const myId = useO(myIdState)
	const myRoomId = useO(myRoomKeyState)
	const spawnHand = useServerAction(spawnHandTX)
	const spawnClassicDeck = useServerAction(spawnClassicDeckTX)
	return (
		<span className={scss.class}>
			{myId ? (
				<button.curledLeft
					className={comic.class}
					onClick={() => {
						const groupId = nanoid()
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
						const deckId = nanoid()
						const cardIds = Array.from({ length: 52 }).map(() => nanoid())
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
