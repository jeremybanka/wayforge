import type { FC } from "react"

import { css } from "@emotion/react"
import { useRecoilValue } from "recoil"

import {
  findEnergyState,
  energyIndex,
  useAddEnergy,
  useRemoveEnergy,
} from "../../services/energy"
import { useSetTitle } from "../../services/view"
import { EnergyListItem } from "./EnergyListItem"

export const EnergyOverview: FC = () => {
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
      <ul>
        {[...ids].map((id) => (
          <EnergyListItem key={id} id={id} findState={findEnergyState} />
        ))}
        <button onClick={addEnergy}>Add</button>
      </ul>
    </div>
  )
}
