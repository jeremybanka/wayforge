import type { FC } from "react"

import { css } from "@emotion/react"

import type { Identified } from "~/lib/recoil-tools/effects/socket-io.server"

import { findReactionWithRelationsState } from "../../services/reaction"
import { ReactionEditor } from "./ReactionEditor"

export const ReactionListItem: FC<Identified> = ({ id }) => (
  <li
    css={css`
      border: 2px solid #333;
      padding: 20px;
    `}
  >
    <ReactionEditor id={id} findState={findReactionWithRelationsState} />
  </li>
)

export const ReactionList: FC<{ ids: string[]; createNew: () => void }> = ({
  ids,
  createNew,
}) => (
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
    {ids.map((id) => (
      <ReactionListItem key={id} id={id} />
    ))}
    <button onClick={createNew}>Add</button>
  </ul>
)
