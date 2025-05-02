import type { AtomListItemProps } from "hamr/atom.io-tools"
import type { FC } from "react"

import type { Reaction } from "../../services/reaction"
import { RecoverableErrorBoundary } from "../RecoverableErrorBoundary"
import { Div_ReactionIcon } from "./ReactionIcon"

export const ReactionListItem: FC<AtomListItemProps<Reaction>> = ({ label }) => (
	<RecoverableErrorBoundary>
		<Div_ReactionIcon reactionId={label.id} size={30} />
	</RecoverableErrorBoundary>
)
