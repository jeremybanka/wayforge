import type { FC } from "react"

import { RecoverableErrorBoundary } from "~/packages/hamr/recoil-error-boundary/src"
import type { RecoilListItemProps } from "~/packages/hamr/recoil-tools/src/RecoilList"

import type { Reaction } from "../../services/reaction"
import { ReactionIconDiv } from "../reaction/ReactionIcon"

export const ReactionListItem: FC<RecoilListItemProps<Reaction>> = ({
	label,
}) => (
	<RecoverableErrorBoundary>
		<ReactionIconDiv reactionId={label.id} size={30} />
	</RecoverableErrorBoundary>
)
