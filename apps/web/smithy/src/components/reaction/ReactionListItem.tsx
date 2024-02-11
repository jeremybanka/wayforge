import type { FC } from "react"

import { RecoverableErrorBoundary } from "~/packages/hamr/recoil-error-boundary/src"
import type { RecoilListItemProps } from "~/packages/hamr/recoil-tools/src/RecoilList"

import type { Reaction } from "../../services/reaction"
import { Div_ReactionIcon } from "./ReactionIcon"

export const ReactionListItem: FC<RecoilListItemProps<Reaction>> = ({
	label,
}) => (
	<RecoverableErrorBoundary>
		<Div_ReactionIcon reactionId={label.id} size={30} />
	</RecoverableErrorBoundary>
)
