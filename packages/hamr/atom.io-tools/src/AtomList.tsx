import type { WritableToken } from "atom.io"
import type { WC } from "hamr/react-json-editor"
import type { FC, ReactElement } from "react"

import type { Identified } from "~/packages/anvl/src/id/identified"

export type AtomListItemProps<DATA, META = {}> = {
	label: Identified & META
	findState: (key: string) => WritableToken<DATA>
	removeMe: () => void
}

export type AtomListProps<DATA, META = {}> = {
	labels: (Identified & META)[]
	findState: (id: string) => WritableToken<DATA>
	useCreate?: () => () => void
	useRemove?: () => (id: string) => void
	Components: {
		Wrapper?: WC
		ItemCreator?: FC<{
			useCreate: () => () => void
		}>
		ListItem: FC<AtomListItemProps<DATA, META>>
		ListItemWrapper?: WC
		NoItems?: FC
	}
}

export const ListItems = <DATA, META = {}>({
	labels,
	findState,
	useCreate,
	useRemove,
	Components: {
		Wrapper = ({ children }) => <>{children}</>,
		ListItem,
		ListItemWrapper = ({ children }) => <>{children}</>,
		ItemCreator,
		NoItems,
	},
}: AtomListProps<DATA, META>): ReactElement => {
	const remove =
		useRemove?.() ??
		((id) => {
			console.warn(`tried to remove ${id}, but no useRemove was provided`)
		})
	return (
		<Wrapper>
			{labels.length > 0 || NoItems === undefined ? (
				labels.map((label) => (
					<ListItemWrapper key={label.id}>
						<ListItem
							label={label}
							findState={findState}
							removeMe={() => {
								remove(label.id)
							}}
						/>
					</ListItemWrapper>
				))
			) : (
				<NoItems />
			)}
			{ItemCreator && useCreate && <ItemCreator useCreate={useCreate} />}
		</Wrapper>
	)
}
