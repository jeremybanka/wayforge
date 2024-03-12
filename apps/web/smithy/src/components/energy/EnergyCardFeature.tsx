import type { FC } from "react"
import { useRecoilValue } from "recoil"

import type { RecoilListItemProps } from "~/packages/hamr/recoil-tools/src/RecoilList"

import type { Reaction, ReactionRelations } from "../../services/reaction"
import { ReactionIconInternal } from "../reaction/ReactionIcon"

import scss from "./EnergyCardFeature.module.scss"

export const EnergyCardFeatureDiv: FC<
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
			<ReactionIconInternal reaction={reaction} size={20} mode="fancy" />
		</div>
	)
}
