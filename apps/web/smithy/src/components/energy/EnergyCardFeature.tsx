import type { FC } from "react"
import { useO } from "atom.io/react"

import type { Reaction, ReactionRelations } from "../../services/reaction"
import { ReactionIcon_INTERNAL } from "../reaction/ReactionIcon"
import scss from "./EnergyCardFeature.module.scss"
import { AtomListItemProps } from "hamr/atom.io-tools"

export const Div_EnergyCardFeature: FC<
	AtomListItemProps<Reaction & ReactionRelations>
> = ({ label, family }) => {
	const reaction = useO(family, label.id)

	return (
		<div className={scss.class}>
			<h2>
				{reaction.name}
				<small>
					{reaction.time}
					{reaction.timeUnit}
				</small>
			</h2>
			<ReactionIcon_INTERNAL reaction={reaction} size={20} mode="fancy" />
		</div>
	)
}
