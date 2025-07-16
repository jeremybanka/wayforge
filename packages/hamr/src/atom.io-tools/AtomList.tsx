import type { Identified } from "anvl/identified"
import type { WritableFamilyToken } from "atom.io"
import type { WC } from "hamr/react-json-editor"
import type { FC, ReactElement } from "react"

export type AtomListItemProps<DATA, META = {}> = {
	label: Identified & META
	family: WritableFamilyToken<DATA, string>
	removeMe: () => void
}

export type AtomListProps<DATA, META = {}> = {
	labels: (Identified & META)[]
	family: WritableFamilyToken<DATA, string>
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
	family,
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
							family={family}
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
