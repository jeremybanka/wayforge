import styled from "@emotion/styled"
import type { FC } from "react"

import type { Identified } from "~/packages/anvl/src/id/identified"
import { ListItems } from "~/packages/hamr/recoil-tools/src/RecoilList"

import {
	findReactionWithRelationsState,
	useRemoveReaction,
} from "../../services/reaction"
import { ReactionEditorListItem } from "../reaction/ReactionEditor"

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
			Wrapper: styled.ul`
        list-style-type: none;
        padding: 0;
        li ~ li {
          margin-top: 20px;
        }
        ul {
          list-style-type: none;
          padding: 0;
        }
      `,
			ListItemWrapper: styled.li`
        border: 2px solid #333;
        padding: 20px;
      `,
			ListItem: ReactionEditorListItem,
			ItemCreator: ({ useCreate }) => {
				const create = useCreate()
				return (
					<button type="button" onClick={create}>
						Add
					</button>
				)
			},
		}}
	/>
)
