import type { FC } from "react"

import type { Reaction } from "../../services/reaction"
import { Div_ReactionIcon } from "./ReactionIcon"
import { AtomListItemProps } from "hamr/atom.io-tools"
import { RecoverableErrorBoundary } from "../RecoverableErrorBoundary"

export const ReactionListItem: FC<AtomListItemProps<Reaction>> = ({ label }) => (
	<RecoverableErrorBoundary>
		<Div_ReactionIcon reactionId={label.id} size={30} />
	</RecoverableErrorBoundary>
)
