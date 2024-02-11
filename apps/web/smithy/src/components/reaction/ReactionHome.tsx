import styled from "@emotion/styled"
import type { FC } from "react"
import { useRecoilValue } from "recoil"

import { ListItems } from "~/packages/hamr/recoil-tools/src/RecoilList"

import {
	findReactionState,
	reactionIndex,
	useAddReaction,
	useRemoveReaction,
} from "../../services/reaction"
import { useSetTitle } from "../../services/view"
import { ReactionListItem } from "./ReactionListItem"

const Wrapper = styled.ul`
	padding: 20px;
	display: inline-flex;
  flex-wrap: wrap;
	list-style: none;
	list-style-type: none;
	border: 2px solid #333;
	gap: 5px;
`

export const ReactionHome: FC = () => {
	useSetTitle(`Reaction`)
	const ids = useRecoilValue(reactionIndex)

	return (
		<Wrapper>
			<ListItems
				labels={[...ids].map((id) => ({ id }))}
				findState={findReactionState}
				useCreate={useAddReaction}
				useRemove={useRemoveReaction}
				Components={{
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
		</Wrapper>
	)
}
