import type { FC } from "react"

import { css } from "@emotion/react"
import { useRecoilValue } from "recoil"

import { RecoilList } from "~/app/wayforge-client/recoil-list"

import {
  energyIndex,
  findEnergyState,
  useAddEnergy,
  useRemoveEnergy,
} from "../../services/energy"
import { useSetTitle } from "../../services/view"
import { EnergyListItem } from "./EnergyListItem"

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
      {/* <EnergyList ids={[...ids]} createNew={addEnergy} /> */}
      <RecoilList
        labels={[...ids].map((id) => ({ id }))}
        findState={findEnergyState}
        useCreate={useAddEnergy}
        useRemove={useRemoveEnergy}
        Components={{
          Wrapper: ({ children }) => <ul>{children}</ul>,
          ListItemWrapper: ({ children }) => <li>{children}</li>,
          ListItem: EnergyListItem,
          ItemCreator: ({ useCreate }) => {
            const create = useCreate()
            return <button onClick={create}>Add</button>
          },
        }}
      />
    </div>
  )
}
