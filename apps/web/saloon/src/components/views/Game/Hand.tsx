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
import { publicDeckIndex } from "./store/public-deck-index"

export const Hand: FC<{ id: string }> = ({ id }) => {
	const isMyHand = useO(myHandsIndex).includes(id)
	const cardIds = useO(groupsOfCards.findState.cardKeysOfGroup(id))
	const publicDeckIds = useO(publicDeckIndex)

	const dealCards = useServerAction(dealCardsTX)

	const handlers = useRadial([
		{
			label: `Deal`,
			do: () => {
				// debugger
				const deckId = publicDeckIds[0]
				dealCards({ deckId, handId: id, count: 1 })
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
					{id} ({cardIds.length})
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
