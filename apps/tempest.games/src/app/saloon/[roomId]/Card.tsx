import { useO } from "atom.io/react"
import { AnimatePresence } from "framer-motion"
import type { FC } from "react"

import { valuesOfCards } from "~/apps/node/lodge/src/store/game"
import { PlayingCards } from "~/apps/web/saloon/src/components/PlayingCards"

import { article } from "src/components/<article>"

export const CardFace: FC<{ id: string }> = ({ id }) => {
	const valueKey = useO(valuesOfCards.findState.valueKeyOfCard(id))
	const PlayingCard = PlayingCards[valueKey as keyof typeof PlayingCards]
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
