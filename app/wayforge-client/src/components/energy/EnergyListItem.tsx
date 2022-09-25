import type { FC } from "react"

import { css } from "@emotion/react"
import { useNavigate } from "react-router-dom"
import type { RecoilState } from "recoil"
import { useRecoilValue } from "recoil"

import type { RecoilListItemProps } from "~/app/wayforge-client/recoil-list"
import { RecoverableErrorBoundary } from "~/lib/react-ui/error-boundary"

import type { Energy } from "../../services/energy"
import { EnergyIcon } from "./EnergyIcon_SVG"

export const EnergyListItem: FC<RecoilListItemProps<Energy>> = ({ id }) => {
  const navigate = useNavigate()
  return (
    <RecoverableErrorBoundary>
      <button onClick={() => navigate(`/energy/${id}`)}>
        <EnergyIcon energyId={id} size={70} />
      </button>
    </RecoverableErrorBoundary>
  )
}
