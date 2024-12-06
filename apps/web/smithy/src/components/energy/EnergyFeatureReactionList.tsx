import styled from "@emotion/styled"
import type { FC } from "react"

import type { Identified } from "~/packages/anvl/src/id/identified"

import {
	reactionIndex,
	reactionWithRelationsAtoms,
} from "../../services/reaction"
import { ReactionEditorListItem } from "../reaction/ReactionEditor"
import { setState } from "atom.io"
import { ListItems } from "hamr/atom.io-tools"

export const ReactionList: FC<{
	labels: Identified[]
	useCreate: () => () => void
}> = ({ labels, useCreate }) => (
	<ListItems
		labels={labels}
		family={reactionWithRelationsAtoms}
		useCreate={useCreate}
		useRemove={() => (id: string) => {
			setState(reactionIndex, (current) => {
				const next = new Set<string>(current)
				next.delete(id)
				return next
			})
		}}
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
			ItemCreator: ({ useCreate: useCreateItem }) => {
				const create = useCreateItem()
				return (
					<button type="button" onClick={create}>
						Add
					</button>
				)
			},
		}}
	/>
)
