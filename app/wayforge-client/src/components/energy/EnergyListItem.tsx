import type { FC } from "react"

import { css } from "@emotion/react"
import { useNavigate } from "react-router-dom"
import type { RecoilState } from "recoil"
import { useRecoilValue } from "recoil"

import { RecoverableErrorBoundary } from "~/lib/react-ui/error-boundary"

import type { Energy } from "../../services/energy"
import { EnergyIcon } from "./EnergyIcon_SVG"

export type RecoilIndexProps<T> = {
  id: string
  findState: (key: string) => RecoilState<T>
}

export const EnergyListItem: FC<RecoilIndexProps<Energy>> = ({
  id,
  findState,
}) => {
  const energyState = findState(id)
  const energy = useRecoilValue(energyState)
  const navigate = useNavigate()
  return (
    <li
      css={css`
        border: 2px solid #333;
        padding: 20px;
      `}
    >
      <RecoverableErrorBoundary>
        <EnergyIcon energy={energy} size={70} />
      </RecoverableErrorBoundary>
      <button onClick={() => navigate(`/energy/${id}`)}>View</button>
    </li>
  )
}
