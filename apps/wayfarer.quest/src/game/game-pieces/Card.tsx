import { findRelations } from "atom.io/data"
import { useO } from "atom.io/react"
import { AnimatePresence } from "motion/react"
import Image from "next/image"
import type { FC } from "react"
import { article } from "wayfarer.quest/components/<article>"
import { PlayingCards } from "wayfarer.quest/components/PlayingCards"

import { valuesOfCards } from "~/apps/core.wayfarer.quest/src/store/game/card-game-stores/card-values-store"
import type { CardKey } from "~/apps/core.wayfarer.quest/src/store/game/card-game-stores/cards-store"

import scss from "./Card.module.scss"

export const CardFace: FC<{ id: CardKey }> = ({ id }) => {
	const valueKey =
		useO(findRelations(valuesOfCards, id).valueKeyOfCard) ?? `Back`
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
