import styled from "@emotion/styled"
import { runTransaction, setState } from "atom.io"
import { useO } from "atom.io/react"
import type { FC } from "react"

import { ListItems } from "~/packages/hamr/atom.io-tools/src/AtomList"

import { addEnergyTX,energyAtoms, energyIndex } from "../../services/energy"
import { useSetTitle } from "../../services/view"
import { EnergyListItem } from "./EnergyListItem"

export const EnergyHome: FC = () => {
	const ids = useO(energyIndex)
	useSetTitle(`Energy`)

	return (
		<div style={{ border: `2px solid #333` }}>
			<ListItems
				labels={[...ids].map((id) => ({ id }))}
				family={energyAtoms}
				useCreate={() => runTransaction(addEnergyTX)}
				useRemove={() => (id) => {
					setState(energyIndex, (current) => {
						const next = new Set<string>(current)
						next.delete(id)
						return next
					})
				}}
				Components={{
					Wrapper: styled.ul`
            padding: 20px;
            display: flex;
            flex-wrap: wrap;
            list-style: none;
            list-style-type: none;
          `,
					ListItemWrapper: ({ children }) => <li>{children}</li>,
					ListItem: EnergyListItem,
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
		</div>
	)
}
