import type { FC } from "react"

import { css } from "@emotion/react"
import styled from "@emotion/styled"

import { RecoilList } from "~/app/wayforge-client/recoil-list"
import type { Identified } from "~/lib/id/identified"

import {
  findReactionWithRelationsState,
  useRemoveReaction,
} from "../../services/reaction"
import { ReactionEditor } from "./ReactionEditor"

export const ReactionList: FC<{
  labels: Identified[]
  useCreate: () => () => void
}> = ({ labels, useCreate }) => (
  <RecoilList
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
