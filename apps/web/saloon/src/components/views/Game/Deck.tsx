import { useO } from "atom.io/react"
import { useServerAction } from "atom.io/realtime-react"
import type { FC } from "react"

import {
	shuffleDeckTX,
	groupsOfCardsState,
} from "~/apps/node/lodge/src/store/game"

import { CardBack } from "./Card"
import scss from "./Deck.module.scss"
import { useRadial } from "../../../services/radial"
import { div } from "../../containers/<div>"

export const Deck: FC<{ id: string }> = ({ id }) => {
	const cardIds = useO(groupsOfCardsState).getRelatedIds(id)

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
