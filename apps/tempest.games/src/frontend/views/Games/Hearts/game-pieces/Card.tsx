import { findRelations } from "atom.io"
import { useO } from "atom.io/react"
import { AnimatePresence } from "motion/react"
import type { FC } from "react"

import { valuesOfCards } from "../../../../../library/topdeck"
import { article } from "../components/article"
import scss from "./Card.module.scss"

export const CardFace: FC<{ id: string }> = ({ id }) => {
	const valueKey =
		useO(findRelations(valuesOfCards, id).valueKeyOfCard) ?? `Back`
	return (
		<span className={scss[`class`]} data-css="card">
			<AnimatePresence>
				<article.whiteCard layoutId={id}>
					<img src={`./playing-cards/${valueKey}.svg`} alt="card" />
				</article.whiteCard>
			</AnimatePresence>
		</span>
	)
}
export const CardBack: FC<{ id: string }> = ({ id }) => {
	return (
		<span className={scss[`class`]} data-css="card">
			<AnimatePresence>
				<article.redCard layoutId={id} />
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
