
import { css } from "@emotion/react"
import { useO } from "atom.io/react"
import { useServerAction } from "atom.io/realtime-react"
import type { FC } from "react"

import {
	shuffleDeckTX,
	groupsOfCardsState,
} from "~/apps/node/lodge/src/store/game"

import { CardBack } from "./Card"
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
			<div.dropShadowDiagon
				css={css`
          padding: 5px;
        `}
				{...handlers}
			>
				{cardIds.length}
				<div
					css={css`
            display: flex;
            flex-flow: column-reverse nowrap;
            > * ~ * {
              margin-bottom: -119.5px;
            }
          `}
				>
					{cardIds.map((cardId) => (
						<CardBack key={cardId} id={cardId} />
					))}
				</div>
			</div.dropShadowDiagon>
		</>
	)
}
