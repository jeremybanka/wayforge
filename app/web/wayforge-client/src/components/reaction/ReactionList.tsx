import type { FC } from "react"

import { css } from "@emotion/react"
import styled from "@emotion/styled"

import { ListItems } from "~/app/web/wayforge-client/recoil-list"
import type { Identified } from "~/packages/anvl/src/id/identified"

import { ReactionEditor } from "./ReactionEditor"
import {
  findReactionWithRelationsState,
  useRemoveReaction,
} from "../../services/reaction"

export const ReactionList: FC<{
  labels: Identified[]
  useCreate: () => () => void
}> = ({ labels, useCreate }) => (
  <ListItems
    labels={labels}
    findState={findReactionWithRelationsState}
    useCreate={useCreate}
    useRemove={useRemoveReaction}
    Components={{
      Wrapper: styled.ul(css`
        list-style-type: none;
        padding: 0;
        li ~ li {
          margin-top: 20px;
        }
        ul {
          list-style-type: none;
          padding: 0;
        }
      `),
      ListItemWrapper: styled.li(css`
        border: 2px solid #333;
        padding: 20px;
      `),
      ListItem: ReactionEditor,
      ItemCreator: ({ useCreate }) => {
        const create = useCreate()
        return <button onClick={create}>Add</button>
      },
    }}
  />
)
