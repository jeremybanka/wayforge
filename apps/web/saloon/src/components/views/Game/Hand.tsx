import { useO } from "atom.io/react"
import { useServerAction } from "atom.io/realtime-react"
import { AnimatePresence } from "framer-motion"
import type { FC } from "react"

import { dealCardsTX, groupsOfCards } from "~/apps/node/lodge/src/store/game"

import { useRadial } from "../../../services/radial"
import { div } from "../../containers/<div>"
import { CardBack, CardFace } from "./Card"
import scss from "./Hand.module.scss"
import { myHandsIndex } from "./store/my-hands-index"
import { myRoomState } from "./store/my-room"
import { publicDeckIndex } from "./store/public-deck-index"

export const Hand: FC<{ id: string }> = ({ id: handId }) => {
	const myRoomId = useO(myRoomState)
	const isMyHand = useO(myHandsIndex).includes(handId)
	const cardIds = useO(groupsOfCards.findState.cardKeysOfGroup(handId))
	const publicDeckIds = useO(publicDeckIndex)

	const dealCards = useServerAction(dealCardsTX)

	const handlers = useRadial([
		{
			label: `Deal`,
			do: () => {
				const deckId = publicDeckIds[0]
				if (!myRoomId) {
					console.error(`Tried to deal cards without being in a room.`)
					return
				}
				dealCards(myRoomId, deckId, handId, 1)
			},
		},
	])

	return (
		<AnimatePresence>
			<div.dropShadowDiagon
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				{...handlers}
			>
				<div>
					{handId} ({cardIds.length})
				</div>
				<div className={scss.class}>
					{isMyHand
						? cardIds.map((cardId) => <CardFace key={cardId} id={cardId} />)
						: cardIds.map((cardId) => <CardBack key={cardId} id={cardId} />)}
				</div>
			</div.dropShadowDiagon>
		</AnimatePresence>
	)
}
