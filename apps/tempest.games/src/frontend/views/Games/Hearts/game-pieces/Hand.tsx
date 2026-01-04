import { findRelations, runTransaction } from "atom.io"
import { useO } from "atom.io/react"
import { useRealtimeRooms } from "atom.io/realtime-react"
import { setCssVars } from "hamr/react-css-vars"
import { AnimatePresence, motion } from "motion/react"

import { dealCardsTX, groupsOfCards } from "../../../../../library/topdeck"
import { memoize } from "../components/memoize"
import { myHandsIndex } from "../hearts-client-store/my-hands-index"
import { publicDeckIndex } from "../hearts-client-store/public-deck-index"
import { Count } from "../labels/Count"
import { useRadial } from "../peripherals/radial"
import { useDOMRect } from "../peripherals/use-dimensions"
import { CardBack, CardFace, CardSlot } from "./Card"
import scss from "./Hand.module.scss"

export const Hand = memoize<{ id: string; detailed?: boolean }>(
	`Hand`,
	({ id: handId, detailed }) => {
		const { myRoomKey } = useRealtimeRooms()
		const isMyHand = useO(myHandsIndex).includes(handId)
		const cardIds = useO(findRelations(groupsOfCards, handId).cardKeysOfGroup)
		const publicDeckIds = useO(publicDeckIndex)

		const dealCards = runTransaction(dealCardsTX)

		const handlers = useRadial([
			{
				label: `Deal`,
				do: () => {
					const deckId = publicDeckIds[0]
					if (!myRoomKey) {
						console.error(`Tried to deal cards without being in a room.`)
						return
					}
					dealCards(deckId, handId, 1)
				},
			},
		])

		const [ref, rect] = useDOMRect()
		const height = rect?.height ?? 0

		return (
			<AnimatePresence>
				<span
					className={scss[`class`]}
					style={setCssVars({
						"--child-len": `${height * (5 / 7)}px`,
						"--child-count": cardIds.length,
					})}
					{...handlers}
				>
					{detailed ? <div>Hand ({cardIds.length})</div> : null}
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
