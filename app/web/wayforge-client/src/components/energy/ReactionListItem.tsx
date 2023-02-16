import type { FC } from "react"

import { useNavigate } from "react-router-dom"

import type { RecoilListItemProps } from "~/app/web/wayforge-client/recoil-list"
import { RecoverableErrorBoundary } from "~/packages/hamr/react-ui/error-boundary"

import type { Reaction } from "../../services/reaction"

export const ReactionListItem: FC<RecoilListItemProps<Reaction>> = ({
  label,
}) => {
  const navigate = useNavigate()
  return (
    <RecoverableErrorBoundary>
      <button onClick={() => navigate(`/reaction/${label.id}`)}>
        {label.id}
      </button>
    </RecoverableErrorBoundary>
  )
}
