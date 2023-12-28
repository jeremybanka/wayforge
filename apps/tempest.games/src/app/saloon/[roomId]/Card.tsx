import { useO } from "atom.io/react"
import { AnimatePresence } from "framer-motion"
import Image from "next/image"
import type { FC } from "react"

import { valuesOfCards } from "~/apps/node/lodge/src/store/game"

import { article } from "src/components/<article>"
import { PlayingCards } from "src/components/PlayingCards"

export const CardFace: FC<{ id: string }> = ({ id }) => {
	const valueKey = useO(valuesOfCards.findState.valueKeyOfCard(id))
	const PlayingCard = PlayingCards[valueKey as keyof typeof PlayingCards]
	console.log(`❗ PlayingCard`, PlayingCard)
	return (
		<AnimatePresence>
			<article.roundedWhite layoutId={id}>
				<Image src={PlayingCard.src} alt="card" height={175} width={125} />
			</article.roundedWhite>
		</AnimatePresence>
	)
}
export const CardBack: FC<{ id: string }> = ({ id }) => {
	return (
		<AnimatePresence>
			<article.roundedWhite layoutId={id}>
				<Image src={PlayingCards.Back.src} alt="card" height={175} width={125} />
			</article.roundedWhite>
		</AnimatePresence>
	)
}
