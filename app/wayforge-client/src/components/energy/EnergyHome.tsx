import type { FC } from "react"

import { css } from "@emotion/react"
import { useRecoilValue } from "recoil"

import { energyIndex, useAddEnergy } from "../../services/energy"
import { useSetTitle } from "../../services/view"
import { EnergyList } from "./EnergyList"

export const EnergyHome: FC = () => {
  const ids = useRecoilValue(energyIndex)
  const addEnergy = useAddEnergy()
  useSetTitle(`Energy`)

  return (
    <div
      css={css`
        border: 2px solid #333;
        ul {
          padding: 20px;
          display: flex;
          flex-wrap: wrap;
          list-style: none;
          list-style-type: none;
        }
      `}
    >
      <EnergyList ids={[...ids]} createNew={addEnergy} />
    </div>
  )
}
