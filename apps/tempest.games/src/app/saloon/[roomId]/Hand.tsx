import { useO } from "atom.io/react"
import {
	usePullMutableFamilyMember,
	useServerAction,
} from "atom.io/realtime-react"
import { AnimatePresence, motion } from "framer-motion"
import * as React from "react"

import { dealCardsTX, groupsOfCards } from "~/apps/node/lodge/src/store/game"

import { setCssVars } from "hamr/react-css-vars"
import { Id } from "hamr/react-id"
import { memoize } from "src/components/memoize"
import { useRadial } from "src/services/peripherals/radial"
import { myHandsIndex } from "src/services/store/my-hands-index"
import { publicDeckIndex } from "src/services/store/public-deck-index"
import { CardBack, CardFace, CardSlot } from "./Card"
import scss from "./Hand.module.scss"

export const Hand = memoize<{ id: string; showMeta?: string }>(
	`Deck`,
	({ id, showMeta }) => {
		const isMyHand = useO(myHandsIndex).includes(id)
		const cardIds = useO(groupsOfCards.findState.cardKeysOfGroup(id))
		const publicDeckIds = useO(publicDeckIndex)

		usePullMutableFamilyMember(groupsOfCards.core.findRelatedKeysState(id))

		const dealCards = useServerAction(dealCardsTX)

		const handlers = useRadial([
			{
				label: `Deal`,
				do: () => {
					// debugger
					const deckId = publicDeckIds[0]
					// debugger
					dealCards({ deckId, handId: id, count: 1 })
				},
			},
		])

		const [height, setHeight] = React.useState(0)
		const ref = React.useRef(null)

		React.useEffect(() => {
			const observeTarget = ref.current
			const resizeObserver = new ResizeObserver(([entry]) => {
				setHeight(entry.contentRect.height)
			})

			if (observeTarget) {
				resizeObserver.observe(observeTarget)
			}

			return () => {
				if (observeTarget) {
					resizeObserver.unobserve(observeTarget)
				}
			}
		}, [ref])

		return (
			<AnimatePresence>
				<span className={scss.class} {...handlers}>
					{showMeta ? (
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
						style={setCssVars({
							"--child-len": `${height * (5 / 7)}px`,
							"--child-count": cardIds.length,
						})}
					>
						{cardIds.length === 0 ? (
							<CardSlot />
						) : isMyHand ? (
							cardIds.map((cardId) => <CardFace key={cardId} id={cardId} />)
						) : (
							cardIds.map((cardId) => <CardBack key={cardId} id={cardId} />)
						)}
					</motion.article>
				</span>
			</AnimatePresence>
		)
	},
)
