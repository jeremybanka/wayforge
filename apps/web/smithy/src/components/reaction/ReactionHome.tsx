import type { FC } from "react"

import styled from "@emotion/styled"
import { useRecoilValue } from "recoil"

import { ListItems } from "~/packages/hamr/src/recoil-tools/RecoilList"

import { ReactionListItem } from "./ReactionListItem"
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
		<ListItems
			labels={[...ids].map((id) => ({ id }))}
			findState={findReactionState}
			useCreate={useAddReaction}
			useRemove={useRemoveReaction}
			Components={{
				Wrapper: styled.ul`
          padding: 20px;
          display: inline-flex;
          flex-wrap: wrap;
          list-style: none;
          list-style-type: none;
          border: 2px solid #333;
          gap: 5px;
        `,
				ListItemWrapper: ({ children }) => <li>{children}</li>,
				ListItem: ReactionListItem,
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
}
