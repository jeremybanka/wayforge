import type { FC } from "react"

import { css } from "@emotion/react"
import styled from "@emotion/styled"
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
  useSetTitle(`Energy`)

  return (
    <div
      css={css`
        border: 2px solid #333;
      `}
    >
      <RecoilList
        labels={[...ids].map((id) => ({ id }))}
        findState={findEnergyState}
        useCreate={useAddEnergy}
        useRemove={useRemoveEnergy}
        Components={{
          Wrapper: styled.ul`
            padding: 20px;
            display: flex;
            flex-wrap: wrap;
            list-style: none;
            list-style-type: none;
          `,
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
