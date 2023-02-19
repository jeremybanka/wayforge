import type { FC } from "react"

import { RecoverableErrorBoundary } from "~/packages/hamr/react-ui/error-boundary"
import type { RecoilListItemProps } from "~/packages/hamr/recoil-tools/recoil-list"

import { Div_ReactionIcon } from "./ReactionIcon"
import type { Reaction } from "../../services/reaction"

export const ReactionListItem: FC<RecoilListItemProps<Reaction>> = ({
  label,
}) => (
  <RecoverableErrorBoundary>
    <Div_ReactionIcon reactionId={label.id} size={30} />
  </RecoverableErrorBoundary>
)
