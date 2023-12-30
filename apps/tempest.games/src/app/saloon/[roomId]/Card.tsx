import { useO } from "atom.io/react"
import { AnimatePresence } from "framer-motion"
import { motion } from "framer-motion"
import Image from "next/image"
import type { FC } from "react"

import { valuesOfCards } from "~/apps/node/lodge/src/store/game"

import { usePullMutableFamilyMember } from "atom.io/realtime-react"
import { article } from "src/components/<article>"
import { PlayingCards } from "src/components/PlayingCards"

import scss from "./Card.module.scss"

const { Back } = PlayingCards

export const CardFace: FC<{ id: string }> = ({ id }) => {
	usePullMutableFamilyMember(valuesOfCards.core.findRelatedKeysState(id))
	const valueKey = useO(valuesOfCards.findState.valueKeyOfCard(id)) ?? `Back`
	const PlayingCard = PlayingCards[valueKey]
	return (
		<span className={scss.class}>
			<AnimatePresence>
				<article.whiteCard layoutId={id}>
					<Image src={PlayingCard.src} alt="card" height={175} width={125} />
				</article.whiteCard>
			</AnimatePresence>
		</span>
	)
}
export const CardBack: FC<{ id: string }> = ({ id }) => {
	return (
		<span className={scss.class}>
			<AnimatePresence>
				<article.redCard layoutId={id}>
					<Image src={Back.src} alt="card" height={175} width={125} />
				</article.redCard>
			</AnimatePresence>
		</span>
	)
}

export const CardSlot: FC<{ onClick?: () => void }> = ({ onClick }) => {
	return (
		<span className={scss.class}>
			<AnimatePresence>
				<article.greyCardSlot onClick={onClick} />
			</AnimatePresence>
		</span>
	)
}
