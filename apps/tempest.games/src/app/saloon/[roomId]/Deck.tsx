import { useO } from "atom.io/react"
import { useServerAction } from "atom.io/realtime-react"
import type { FC } from "react"

import { groupsOfCards, shuffleDeckTX } from "~/apps/node/lodge/src/store/game"

import { useRadial } from "~/apps/web/saloon/src/services/radial"
import { div } from "../../../components/<div>"
import { CardBack } from "./Card"
import scss from "./Deck.module.scss"

export const Deck: FC<{ id: string }> = ({ id }) => {
	const cardIds = useO(groupsOfCards.findState.cardKeysOfGroup(id))

	console.log(`❗❗`, { cardIds })

	const shuffle = useServerAction(shuffleDeckTX)

	const handlers = useRadial([
		{
			label: `Shuffle`,
			do: () => shuffle({ deckId: id }),
		},
	])

	return (
		<>
			<div.dropShadowDiagon className={scss.class} {...handlers}>
				<div>
					{id} ({cardIds.length})
				</div>
				<div>
					{cardIds.map((cardId) => (
						<CardBack key={cardId} id={cardId} />
					))}
				</div>
			</div.dropShadowDiagon>
		</>
	)
}
