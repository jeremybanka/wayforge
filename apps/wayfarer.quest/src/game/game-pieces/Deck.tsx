import { findRelations, runTransaction } from "atom.io"
import { useO } from "atom.io/react"
import { groupsOfCards, shuffleDeckTX } from "core.wayfarer.quest/src/store/game"
import { setCssVars } from "hamr/react-css-vars"
import { AnimatePresence, motion } from "motion/react"
import { memoize } from "wayfarer.quest/components/memoize"
import { useRadial } from "wayfarer.quest/services/peripherals/radial"
import { useDOMRect } from "wayfarer.quest/services/use-dimensions"

import { Count } from "../labels/Count"
import { CardBack } from "./Card"
import scss from "./Deck.module.scss"

export const Deck = memoize<{ id: string; detailed?: boolean }>(
	`Deck`,
	({ id: deckId, detailed }) => {
		const cardIds = useO(findRelations(groupsOfCards, deckId).cardKeysOfGroup)

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
					className={scss[`class`]}
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
