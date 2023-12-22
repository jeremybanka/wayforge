import { useO } from "atom.io/react"
import { AnimatePresence } from "framer-motion"
import type { FC } from "react"

import { valuesOfCards } from "~/apps/node/lodge/src/store/game"

import { PlayingCards } from "../../PlayingCards"
import { article } from "../../containers/<article>"

export const CardFace: FC<{ id: string }> = ({ id }) => {
	const value = useO(valuesOfCards.findState.valueKeyOfCard(id))
	const PlayingCard = PlayingCards[value as keyof typeof PlayingCards]
	return (
		<AnimatePresence>
			<article.roundedWhite layoutId={id}>
				{PlayingCard ? <PlayingCard /> : null}
			</article.roundedWhite>
		</AnimatePresence>
	)
}
export const CardBack: FC<{ id: string }> = ({ id }) => {
	return (
		<AnimatePresence>
			<article.roundedWhite layoutId={id}>
				{/* <PlayingCards.Back /> */}
			</article.roundedWhite>
		</AnimatePresence>
	)
}
