import { useO } from "atom.io/react"
import {
	usePullMutableFamilyMember,
	useServerAction,
} from "atom.io/realtime-react"
import { motion } from "framer-motion"

import { groupsOfCards, shuffleDeckTX } from "~/apps/node/lodge/src/store/game"

import { memoize } from "src/components/memoize"
import { useRadial } from "src/services/peripherals/radial"
import { CardBack } from "./Card"

import { Id } from "hamr/react-id"
import scss from "./Deck.module.scss"

export const Deck = memoize<{ id: string }>(`Deck`, ({ id }) => {
	const cardIds = useO(groupsOfCards.findState.cardKeysOfGroup(id))

	usePullMutableFamilyMember(groupsOfCards.core.findRelatedKeysState(id))

	const shuffle = useServerAction(shuffleDeckTX)

	const handlers = useRadial([
		{
			label: `Shuffle`,
			do: () => shuffle({ deckId: id }),
		},
	])

	return (
		<>
			<motion.span className={scss.class} {...handlers}>
				<div>Deck ({cardIds.length})</div>
				<Id id={id} />
				<div>
					{cardIds.map((cardId) => (
						<CardBack key={cardId} id={cardId} />
					))}
				</div>
			</motion.span>
		</>
	)
})
