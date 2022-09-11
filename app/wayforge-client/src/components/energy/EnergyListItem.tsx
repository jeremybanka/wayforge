import type { FC } from "react"

import { css } from "@emotion/react"
import type { RecoilState } from "recoil"
import { useRecoilValue } from "recoil"

import { RecoverableErrorBoundary } from "~/lib/react-ui/error-boundary"

import type { Energy } from "../../services/energy"
import { EnergyIcon } from "./EnergyIcon_SVG"

export type RecoilIndexProps<T> = {
  id: string
  findState: (key: string) => RecoilState<T>
  unlink: () => void
}

export const EnergyListItem: FC<RecoilIndexProps<Energy>> = ({
  id,
  findState,
  unlink,
}) => {
  const energyState = findState(id)
  const energy = useRecoilValue(energyState)

  return (
    <li
      css={css`
        border: 2px solid #333;
        padding: 20px;
      `}
    >
      <RecoverableErrorBoundary>
        <EnergyIcon energy={energy} />
      </RecoverableErrorBoundary>
    </li>
  )
}
