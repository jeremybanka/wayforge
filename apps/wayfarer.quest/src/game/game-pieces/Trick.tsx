import { useO } from "atom.io/react"
import { AnimatePresence, motion } from "framer-motion"
import { Id } from "hamr/react-id"
import { setCssVars } from "~/packages/hamr/react-css-vars/src"

import { trickContentsStates } from "~/apps/core.wayfarer.quest/src/store/game"

import { memoize } from "wayfarer.quest/components/memoize"
import { useRadial } from "wayfarer.quest/services/peripherals/radial"
import { useDOMRect } from "wayfarer.quest/services/use-dimensions"
import { Count } from "../labels/Count"
import { CardFace, CardSlot } from "./Card"

import scss from "./Trick.module.scss"

export const Trick = memoize<{ id: string; gameId: string; detailed?: boolean }>(
	`Trick`,
	({ id: trickId, detailed }) => {
		const trickContent = useO(trickContentsStates, trickId)
		const handlers = useRadial([])

		const [ref, rect] = useDOMRect()
		const height = rect?.height ?? 0

		return (
			<AnimatePresence>
				<span
					className={scss.class}
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
