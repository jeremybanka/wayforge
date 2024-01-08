import { useO } from "atom.io/react"
import {
	usePullMutableFamilyMember,
	useServerAction,
} from "atom.io/realtime-react"
import { AnimatePresence, motion } from "framer-motion"
import { setCssVars } from "hamr/react-css-vars"
import { Id } from "hamr/react-id"

import { groupsOfCards, shuffleDeckTX } from "~/apps/node/lodge/src/store/game"

import { memoize } from "src/components/memoize"
import { useRadial } from "src/services/peripherals/radial"
import { useDOMRect } from "src/services/use-dimensions"
import { CardBack } from "./Card"

import { myRoomState } from "src/services/store/my-room"
import { Count } from "../labels/Count"
import scss from "./Deck.module.scss"

export const Deck = memoize<{ id: string; detailed?: boolean }>(
	`Deck`,
	({ id: deckId, detailed }) => {
		const myRoomId = useO(myRoomState)
		const cardIds = useO(groupsOfCards.states.cardKeysOfGroup(deckId))

		usePullMutableFamilyMember(groupsOfCards.core.findRelatedKeysState(deckId))

		const shuffle = useServerAction(shuffleDeckTX)

		const handlers = useRadial([
			{
				label: `Shuffle`,
				do: () => {
					if (myRoomId) {
						shuffle(myRoomId, deckId)
					} else {
						console.error(`Tried to shuffle a deck without being in a room`)
					}
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
