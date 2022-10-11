import type { FC } from "react"

import { RecoverableErrorBoundary } from "hamr/react-ui/error-boundary"
import { useNavigate } from "react-router-dom"

import type { RecoilListItemProps } from "~/app/wayforge-client/recoil-list-items"

import type { Energy } from "../../services/energy"
import { SVG_EnergyIcon } from "./EnergyIcon_SVG"

export const EnergyListItem: FC<RecoilListItemProps<Energy>> = ({ label }) => {
  const navigate = useNavigate()
  return (
    <RecoverableErrorBoundary>
      <button onClick={() => navigate(`/energy/${label.id}`)}>
        <SVG_EnergyIcon energyId={label.id} size={30} />
      </button>
    </RecoverableErrorBoundary>
  )
}
