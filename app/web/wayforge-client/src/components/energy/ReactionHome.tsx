import type { FC } from "react"

import { css } from "@emotion/react"
import styled from "@emotion/styled"
import { useRecoilValue } from "recoil"

import { ListItems } from "~/app/web/wayforge-client/recoil-list"

import { EnergyListItem } from "./EnergyListItem"
import { ReactionListItem } from "./ReactionListItem"
import {
  energyIndex,
  findEnergyState,
  useAddEnergy,
  useRemoveEnergy,
} from "../../services/energy"
import {
  findReactionState,
  reactionIndex,
  useAddReaction,
  useRemoveReaction,
} from "../../services/reaction"
import { useSetTitle } from "../../services/view"

export const ReactionHome: FC = () => {
  useSetTitle(`Reaction`)
  const ids = useRecoilValue(reactionIndex)

  return (
    <div
      css={css`
        border: 2px solid #333;
      `}
    >
      <ListItems
        labels={[...ids].map((id) => ({ id }))}
        findState={findReactionState}
        useCreate={useAddReaction}
        useRemove={useRemoveReaction}
        Components={{
          Wrapper: styled.ul`
            padding: 20px;
            display: flex;
            flex-wrap: wrap;
            list-style: none;
            list-style-type: none;
          `,
          ListItemWrapper: ({ children }) => <li>{children}</li>,
          ListItem: ReactionListItem,
          ItemCreator: ({ useCreate }) => {
            const create = useCreate()
            return <button onClick={create}>Add</button>
          },
        }}
      />
    </div>
  )
}
