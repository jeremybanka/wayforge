import { useO } from "atom.io/react"
import { setCssVars } from "hamr/react-css-vars"
import { Id } from "hamr/react-id"
import { AnimatePresence, motion } from "motion/react"

import { trickContentsSelectors } from "../../../../../library/game-systems/card-game-stores"
import { memoize } from "../components/memoize"
import { Count } from "../labels/Count"
import { useRadial } from "../peripherals/radial"
import { useDOMRect } from "../peripherals/use-dimensions"
import { CardFace, CardSlot } from "./Card"
import scss from "./Trick.module.scss"

export const Trick = memoize<{ id: string; gameId: string; detailed?: boolean }>(
	`Trick`,
	({ id: trickId, detailed }) => {
		const trickContent = useO(trickContentsSelectors, trickId)
		const handlers = useRadial([])

		const [ref, rect] = useDOMRect()
		const height = rect?.height ?? 0

		return (
			<AnimatePresence>
				<span
					className={scss[`class`]}
					style={setCssVars({
						"--child-len": `${height * (5 / 7)}px`,
						"--child-count": trickContent.length,
					})}
					{...handlers}
				>
					{detailed ? (
						<>
							<div>Trick ({trickContent.length})</div>
							<Id id={trickId} />
						</>
					) : null}
					<motion.article
						ref={ref}
						layoutId={trickId}
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
					>
						{trickContent.map(([playerId, cardId]) => (
							<span key={playerId} data-css="player-contribution">
								{cardId ? <CardFace id={cardId} /> : <CardSlot />}
							</span>
						))}

						{detailed ? null : <Count amount={trickContent.length} />}
					</motion.article>
				</span>
			</AnimatePresence>
		)
	},
)
