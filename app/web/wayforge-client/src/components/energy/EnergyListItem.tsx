import type { FC } from "react"

import { useNavigate } from "react-router-dom"

import type { RecoilListItemProps } from "~/app/web/wayforge-client/recoil-list"
import { RecoverableErrorBoundary } from "~/packages/Hammer/react-ui/error-boundary"

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
