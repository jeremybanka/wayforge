import { runTransaction } from "atom.io"
import { useO } from "atom.io/react"
import { setCssVars } from "hamr/react-css-vars"
import { AnimatePresence, motion } from "motion/react"

import { shuffleDeckTX } from "../../../../../library/game-systems/card-game-actions"
import {
	cardCollectionAtoms,
	type DeckKey,
} from "../../../../../library/game-systems/card-game-state"
import { memoize } from "../components/memoize"
import { Count } from "../labels/Count"
import { useRadial } from "../peripherals/radial"
import { useDOMRect } from "../peripherals/use-dimensions"
import { CardBack } from "./Card"
import scss from "./Deck.module.scss"

export const Deck = memoize<{ key: DeckKey; detailed?: boolean }>(
	`Deck`,
	({ key, detailed }) => {
		const cardKeys = useO(cardCollectionAtoms, key)

		const shuffle = runTransaction(shuffleDeckTX)

		const handlers = useRadial([
			{
				label: `Shuffle`,
				do: () => {
					shuffle(key, Math.random())
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
						"--child-count": `${cardKeys.length}`,
					})}
				>
					{detailed ? (
						<span
							style={{
								paddingBottom: 0.0067 * height * cardKeys.length + 5,
							}}
						>
							<div>Deck</div>
							<Count amount={cardKeys.length} />
						</span>
					) : null}
					<div {...handlers}>
						<motion.article
							ref={ref}
							layoutId={key}
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
						>
							{cardKeys.map((cardKey) => (
								<CardBack key={cardKey} />
							))}
						</motion.article>
						{detailed ? null : <Count amount={cardKeys.length} />}
					</div>
				</span>
			</AnimatePresence>
		)
	},
)
