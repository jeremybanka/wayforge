import { runTransaction } from "atom.io"
import { useO } from "atom.io/react"
import { useRealtimeRooms } from "atom.io/realtime-react"
import { setCssVars } from "hamr/react-css-vars"
import { AnimatePresence, motion } from "motion/react"

import { dealTX } from "~library/game-systems/card-game-actions"
import type { HandKey } from "~library/game-systems/card-game-state"
import { cardCollectionAtoms } from "~library/game-systems/card-game-state"

import { memoize } from "../components/memoize"
import { myHandsSelector } from "../hearts-client-store/my-hands"
import { publicDeckKeysSelector } from "../hearts-client-store/public-decks"
import { Count } from "../labels/Count"
import { useRadial } from "../peripherals/radial"
import { useDOMRect } from "../peripherals/use-dimensions"
import { CardBack, CardFace, CardSlot } from "./Card"
import scss from "./Hand.module.scss"

export const Hand = memoize<{ key: HandKey; detailed?: boolean }>(
	`Hand`,
	({ key, detailed }) => {
		const { myRoomKey } = useRealtimeRooms()
		const isMyHand = useO(myHandsSelector).includes(key)
		const cardIds = useO(cardCollectionAtoms, key)
		const publicDeckIds = useO(publicDeckKeysSelector)

		const dealCards = runTransaction(dealTX)

		const handlers = useRadial([
			{
				label: `Deal`,
				do: () => {
					const deckId = publicDeckIds[0]
					if (!myRoomKey) {
						console.error(`Tried to deal cards without being in a room.`)
						return
					}
					dealCards(deckId, key)
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
						layoutId={key}
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
					>
						{cardIds.length === 0 ? (
							<CardSlot />
						) : isMyHand ? (
							cardIds.map((cardId) => <CardFace key={cardId} />)
						) : (
							cardIds.map((cardId) => <CardBack key={cardId} />)
						)}
						{detailed ? null : <Count amount={cardIds.length} />}
					</motion.article>
				</span>
			</AnimatePresence>
		)
	},
)
