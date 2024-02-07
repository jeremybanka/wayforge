import { useO } from "atom.io/react"
import { AnimatePresence } from "framer-motion"
import Image from "next/image"
import type { FC } from "react"

import { valuesOfCards } from "~/apps/node/lodge/src/store/game"

import { article } from "wayfarer.quest/components/<article>"
import { PlayingCards } from "wayfarer.quest/components/PlayingCards"

import scss from "./Card.module.scss"

export const CardFace: FC<{ id: string }> = ({ id }) => {
	const valueKey = useO(valuesOfCards.states.valueKeyOfCard(id)) ?? `Back`
	const PlayingCard = PlayingCards[valueKey]
	return (
		<span className={scss.class} data-css="card">
			<AnimatePresence>
				<article.whiteCard layoutId={id}>
					<Image src={PlayingCard.src} alt="card" fill />
				</article.whiteCard>
			</AnimatePresence>
		</span>
	)
}
export const CardBack: FC<{ id: string }> = ({ id }) => {
	return (
		<span className={scss.class} data-css="card">
			<AnimatePresence>
				<article.redCard layoutId={id} />
			</AnimatePresence>
		</span>
	)
}

export const CardSlot: FC<{ onClick?: () => void }> = ({ onClick }) => {
	return (
		<span className={scss.class} data-css="card">
			<AnimatePresence>
				<article.greyCardSlot onClick={onClick} />
			</AnimatePresence>
		</span>
	)
}
