import type { FC } from "react"

import { css } from "@emotion/react"

import { RecoilList } from "~/app/wayforge-client/recoil-list"
import type { WC } from "~/lib/react-ui/json-editor"
import type { Identified } from "~/lib/recoil-tools/effects/socket-io.server"

import {
  findReactionWithRelationsState,
  useRemoveReaction,
} from "../../services/reaction"
import { ReactionEditor } from "./ReactionEditor"

const BorderPadItemWrapper: WC = ({ children }) => (
  <li
    css={css`
      border: 2px solid #333;
      padding: 20px;
    `}
  >
    {children}
  </li>
)

const PaddedListWrapper: WC = ({ children }) => (
  <ul
    css={css`
      list-style-type: none;
      padding: 0;
      li ~ li {
        margin-top: 20px;
      }
      ul {
        list-style-type: none;
        padding: 0;
      }
    `}
  >
    {children}
  </ul>
)

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
      Wrapper: PaddedListWrapper,
      ListItem: ReactionEditor,
      ListItemWrapper: BorderPadItemWrapper,
      ItemCreator: ({ useCreate }) => {
        const create = useCreate()
        return <button onClick={create}>Add</button>
      },
    }}
  />
)
