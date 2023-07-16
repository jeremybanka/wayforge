import { css } from "@emotion/react"
import { useO } from "atom.io/react"
import { useServerAction } from "atom.io/realtime-react"
import { AnimatePresence } from "framer-motion"
import type { FC } from "react"

import {
	dealCardsTX,
	groupsOfCardsState,
} from "~/apps/node/lodge/src/store/game"

import { CardBack, CardFace } from "./Card"
import { myHandsIndex } from "./store/my-hands-index"
import { publicDeckIndex } from "./store/public-deck-index"
import { useRadial } from "../../../services/radial"
import { div } from "../../containers/<div>"

export const Hand: FC<{ id: string }> = ({ id }) => {
	const isMyHand = useO(myHandsIndex).includes(id)
	const cardIds = useO(groupsOfCardsState).getRelatedIds(id)
	const publicDeckIds = useO(publicDeckIndex)

	const dealCards = useServerAction(dealCardsTX)

	const handlers = useRadial([
		{
			label: `Deal`,
			do: () => dealCards({ deckId: publicDeckIds[0], handId: id, count: 1 }),
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
				{/* <button.flashFire
          onClick={
          }
        >
          Deal
        </button.flashFire> */}
				<div>{cardIds.length}</div>
				<div
					css={css`
            display: flex;
          `}
				>
					{isMyHand
						? cardIds.map((cardId) => <CardFace key={cardId} id={cardId} />)
						: cardIds.map((cardId) => <CardBack key={cardId} id={cardId} />)}
				</div>
			</div.dropShadowDiagon>
		</AnimatePresence>
	)
}
