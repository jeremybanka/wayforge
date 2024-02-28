import { useO } from "atom.io/react"
import { AnimatePresence, motion } from "framer-motion"
import { setCssVars } from "~/packages/hamr/react-css-vars/src"

import {
	groupsOfCards,
	shuffleDeckTX,
} from "~/apps/core.wayfarer.quest/src/store/game"

import { memoize } from "wayfarer.quest/components/memoize"
import { useRadial } from "wayfarer.quest/services/peripherals/radial"
import { useDOMRect } from "wayfarer.quest/services/use-dimensions"
import { CardBack } from "./Card"

import { runTransaction } from "atom.io"
import { Count } from "../labels/Count"
import scss from "./Deck.module.scss"

export const Deck = memoize<{ id: string; detailed?: boolean }>(
	`Deck`,
	({ id: deckId, detailed }) => {
		const cardIds = useO(groupsOfCards.states.cardKeysOfGroup, deckId)

		const shuffle = runTransaction(shuffleDeckTX)

		const handlers = useRadial([
			{
				label: `Shuffle`,
				do: () => {
					shuffle(deckId, Math.random())
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
						"--child-len": `${height}px`,
						"--child-count": `${cardIds.length}`,
					})}
				>
					{detailed ? (
						<span
							style={{
								paddingBottom: 0.0067 * height * cardIds.length + 5,
							}}
						>
							<div>Deck</div>
							<Count amount={cardIds.length} />
						</span>
					) : null}
					<div {...handlers}>
						<motion.article
							ref={ref}
							layoutId={deckId}
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
						>
							{cardIds.map((cardId) => (
								<CardBack key={cardId} id={cardId} />
							))}
						</motion.article>
						{detailed ? null : <Count amount={cardIds.length} />}
					</div>
				</span>
			</AnimatePresence>
		)
	},
)
