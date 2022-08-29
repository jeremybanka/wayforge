import type { FC } from "react"

import { useRecoilValue } from "recoil"

import {
  findEnergyState,
  energyIndex,
  useAddEnergy,
  useRemoveEnergy,
} from "../../services/energy"
import { EnergyListItem } from "./EnergyListItem"

export const EnergyList: FC = () => {
  const ids = useRecoilValue(energyIndex)
  const addEnergy = useAddEnergy()
  const removeEnergy = useRemoveEnergy()

  return (
    <>
      <ul>
        {[...ids].map((id) => (
          <EnergyListItem
            key={id}
            id={id}
            findState={findEnergyState}
            unlink={() => removeEnergy(id)}
          />
        ))}
      </ul>
      <button onClick={addEnergy}>Add</button>
    </>
  )
}
