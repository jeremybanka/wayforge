import type { FC } from "react"

import { useNavigate } from "react-router-dom"

import type { RecoilListItemProps } from "~/app/wayforge-client/recoil-list"
import { RecoverableErrorBoundary } from "~/lib/react-ui/error-boundary"

import type { Energy } from "../../services/energy"
import { EnergyIcon } from "./EnergyIcon_SVG"

export const EnergyListItem: FC<RecoilListItemProps<Energy>> = ({ label }) => {
  const navigate = useNavigate()
  return (
    <RecoverableErrorBoundary>
      <button onClick={() => navigate(`/energy/${label.id}`)}>
        <EnergyIcon energyId={label.id} size={70} />
      </button>
    </RecoverableErrorBoundary>
  )
}
