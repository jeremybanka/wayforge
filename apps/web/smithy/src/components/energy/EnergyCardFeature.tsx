import type { FC } from "react"
import { useRecoilValue } from "recoil"

import type { RecoilListItemProps } from "~/packages/hamr/recoil-tools/src/RecoilList"

import type { Reaction, ReactionRelations } from "../../services/reaction"
import { ReactionIcon_INTERNAL } from "../reaction/ReactionIcon"

import scss from "./EnergyCardFeature.module.scss"

export const Div_EnergyCardFeature: FC<
	RecoilListItemProps<Reaction & ReactionRelations>
> = ({ label, findState }) => {
	const reaction = useRecoilValue(findState(label.id))

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
