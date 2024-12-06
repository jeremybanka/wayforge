import styled from "@emotion/styled"
import type { FC } from "react"
import { useO } from "atom.io/react"

import { ListItems } from "~/packages/hamr/atom.io-tools/src/AtomList"

import {
	addReactionTX,
	reactionAtoms,
	reactionIndex,
} from "../../services/reaction"
import { useSetTitle } from "../../services/view"
import { ReactionListItem } from "./ReactionListItem"
import { runTransaction, setState } from "atom.io"

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
	const ids = useO(reactionIndex)

	return (
		<Wrapper>
			<ListItems
				labels={[...ids].map((id) => ({ id }))}
				family={reactionAtoms}
				useCreate={() => runTransaction(addReactionTX)}
				useRemove={() => (id: string) => {
					setState(reactionIndex, (current) => {
						const next = new Set<string>(current)
						next.delete(id)
						return next
					})
				}}
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
