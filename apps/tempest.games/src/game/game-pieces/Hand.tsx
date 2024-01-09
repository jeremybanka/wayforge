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

import { memoize } from "tempest.games/components/memoize"
import { useRadial } from "tempest.games/services/peripherals/radial"
import { myHandsIndex } from "tempest.games/services/store/my-hands-index"
import { publicDeckIndex } from "tempest.games/services/store/public-deck-index"
import { CardBack, CardFace, CardSlot } from "./Card"

import { myRoomState } from "tempest.games/services/store/my-room"
import { useDOMRect } from "tempest.games/services/use-dimensions"
import { Count } from "../labels/Count"
import scss from "./Hand.module.scss"

export const Hand = memoize<{ id: string; detailed?: boolean }>(
	`Hand`,
	({ id: handId, detailed }) => {
		const myRoomId = useO(myRoomState)
		const isMyHand = useO(myHandsIndex).includes(handId)
		const cardIds = useO(groupsOfCards.states.cardKeysOfGroup(handId))
		const publicDeckIds = useO(publicDeckIndex)

		usePullMutableFamilyMember(groupsOfCards.core.findRelatedKeysState(handId))

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
						</>
					) : null}
					<motion.article
						ref={ref}
						layoutId={handId}
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
