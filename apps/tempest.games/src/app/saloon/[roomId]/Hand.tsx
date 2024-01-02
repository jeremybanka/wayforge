import { useO } from "atom.io/react"
import {
	usePullMutableFamilyMember,
	useServerAction,
} from "atom.io/realtime-react"
import { AnimatePresence, motion } from "framer-motion"
import { setCssVars } from "hamr/react-css-vars"
import { Id } from "hamr/react-id"
import * as React from "react"

import { dealCardsTX, groupsOfCards } from "~/apps/node/lodge/src/store/game"

import { memoize } from "src/components/memoize"
import { useRadial } from "src/services/peripherals/radial"
import { myHandsIndex } from "src/services/store/my-hands-index"
import { publicDeckIndex } from "src/services/store/public-deck-index"
import { CardBack, CardFace, CardSlot } from "./Card"

import { useDOMRect } from "src/services/use-dimensions"
import { Count } from "./Count"
import scss from "./Hand.module.scss"

export const Hand = memoize<{ id: string; detailed?: boolean }>(
	`Hand`,
	({ id, detailed }) => {
		const isMyHand = useO(myHandsIndex).includes(id)
		const cardIds = useO(groupsOfCards.findState.cardKeysOfGroup(id))
		const publicDeckIds = useO(publicDeckIndex)

		usePullMutableFamilyMember(groupsOfCards.core.findRelatedKeysState(id))

		const dealCards = useServerAction(dealCardsTX)

		const handlers = useRadial([
			{
				label: `Deal`,
				do: () => {
					const deckId = publicDeckIds[0]
					dealCards({ deckId, handId: id, count: 1 })
				},
			},
		])

		const [ref, rect] = useDOMRect()
		const height = rect?.height ?? 0

		return (
			<AnimatePresence>
				<span
					className={scss.class}
					style={setCssVars({
						"--child-len": `${height * (5 / 7)}px`,
						"--child-count": cardIds.length,
					})}
					{...handlers}
				>
					{detailed ? (
						<>
							<div>Hand ({cardIds.length})</div>
							<Id id={id} />
						</>
					) : null}
					<motion.article
						ref={ref}
						layoutId={id}
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
					>
						{cardIds.length === 0 ? (
							<CardSlot />
						) : isMyHand ? (
							cardIds.map((cardId) => <CardFace key={cardId} id={cardId} />)
						) : (
							cardIds.map((cardId) => <CardBack key={cardId} id={cardId} />)
						)}
						{detailed ? null : <Count amount={cardIds.length} />}
					</motion.article>
				</span>
			</AnimatePresence>
		)
	},
)
