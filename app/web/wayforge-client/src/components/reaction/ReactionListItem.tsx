import type { FC } from "react"

import { css } from "@emotion/react"
import corners, { chamfer } from "corners"
import { useNavigate } from "react-router-dom"

import type { RecoilListItemProps } from "~/app/web/wayforge-client/recoil-list"
import { RecoverableErrorBoundary } from "~/packages/hamr/react-ui/error-boundary"

import { SVG_ReactionIcon } from "./ReactionIcon"
import type { Reaction } from "../../services/reaction"

const slantLeft = corners(null, chamfer, null, chamfer).options({
  cornerSize: 5,
  noClipping: true,
  below: { stroke: { color: `var(--fg-color)`, width: 1 } },
})

const Button = slantLeft.button

export const ReactionListItem: FC<RecoilListItemProps<Reaction>> = ({
  label,
}) => {
  const navigate = useNavigate()
  return (
    <RecoverableErrorBoundary>
      <Button
        css={css`
          display: flex;
          border: none;
          padding: 2px;
        `}
        onClick={() => navigate(`/reaction/${label.id}`)}
      >
        <SVG_ReactionIcon reactionId={label.id} size={30} />
      </Button>
    </RecoverableErrorBoundary>
  )
}
