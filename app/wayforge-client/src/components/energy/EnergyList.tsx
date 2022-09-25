import type { FC } from "react"

import { findEnergyState } from "../../services/energy"
import { EnergyListItem } from "./EnergyListItem"

export const EnergyList: FC<{ ids: string[]; createNew: () => void }> = ({
  ids,
  createNew,
}) => (
  <ul>
    {ids.map((id) => (
      <EnergyListItem key={id} id={id} findState={findEnergyState} />
    ))}
    <button onClick={createNew}>Add</button>
  </ul>
)
