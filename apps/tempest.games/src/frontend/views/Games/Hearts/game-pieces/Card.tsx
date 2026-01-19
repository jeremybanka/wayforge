import { useO } from "atom.io/react"
import { AnimatePresence } from "motion/react"
import type { FC } from "react"

import type { CardKey } from "../../../../../library/game-systems/card-game-stores"
import { playingCardValueAtoms } from "../../../../../library/game-systems/standard-deck-game-state"
import { article } from "../components/article"
import scss from "./Card.module.scss"

export const CardFace: FC<{ key: CardKey }> = ({ key }) => {
	const { rank, suit } = useO(playingCardValueAtoms, key)
	return (
		<span className={scss[`class`]} data-css="card">
			<AnimatePresence>
				<article.whiteCard layoutId={key}>
					<img src={`./playing-cards/${rank}${suit}.svg`} alt="card" />
				</article.whiteCard>
			</AnimatePresence>
		</span>
	)
}
export const CardBack: FC<{ key: CardKey }> = ({ key }) => {
	return (
		<span className={scss[`class`]} data-css="card">
			<AnimatePresence>
				<article.redCard layoutId={key} />
			</AnimatePresence>
		</span>
	)
}

export const CardSlot: FC<{ onClick?: () => void }> = ({ onClick }) => {
	return (
		<span className={scss[`class`]} data-css="card">
			<AnimatePresence>
				<article.greyCardSlot onClick={onClick} />
			</AnimatePresence>
		</span>
	)
}
