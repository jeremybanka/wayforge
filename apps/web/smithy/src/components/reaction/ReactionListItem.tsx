import type { FC } from "react"

import { RecoverableErrorBoundary } from "~/packages/hamr/src/recoil-error-boundary"
import type { RecoilListItemProps } from "~/packages/hamr/src/recoil-tools/RecoilList"

import type { Reaction } from "../../services/reaction"
import { Div_ReactionIcon } from "./ReactionIcon"

export const ReactionListItem: FC<RecoilListItemProps<Reaction>> = ({
	label,
}) => (
	<RecoverableErrorBoundary>
		<Div_ReactionIcon reactionId={label.id} size={30} />
	</RecoverableErrorBoundary>
)
