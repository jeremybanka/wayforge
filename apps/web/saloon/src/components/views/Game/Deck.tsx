import { useO } from "atom.io/react"
import { useServerAction } from "atom.io/realtime-react"
import type { FC } from "react"

import { groupsOfCards, shuffleDeckTX } from "~/apps/node/lodge/src/store/game"

import { useRadial } from "../../../services/radial"
import { div } from "../../containers/<div>"
import { CardBack } from "./Card"
import scss from "./Deck.module.scss"

export const Deck: FC<{ id: string }> = ({ id }) => {
	const cardIds = useO(groupsOfCards.findRelatedKeysState(id))

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
				{cardIds.length}
				<div>
					{cardIds.map((cardId) => (
						<CardBack key={cardId} id={cardId} />
					))}
				</div>
			</div.dropShadowDiagon>
		</>
	)
}
