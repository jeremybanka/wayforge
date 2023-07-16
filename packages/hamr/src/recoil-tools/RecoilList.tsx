import type { FC, ReactElement } from "react"
import type { RecoilState } from "recoil"

import type { Identified } from "~/packages/anvl/src/id/identified"
import type { WC } from "~/packages/hamr/src/react-json-editor"

/* eslint-disable @typescript-eslint/ban-types */

export type RecoilListItemProps<DATA, META = {}> = {
	label: Identified & META
	findState: (key: string) => RecoilState<DATA>
	removeMe: () => void
}

export type RecoilListProps<DATA, META = {}> = {
	labels: (Identified & META)[]
	findState: (id: string) => RecoilState<DATA>
	useCreate?: () => () => void
	useRemove?: () => (id: string) => void
	Components: {
		Wrapper?: WC
		ItemCreator?: FC<{
			useCreate: () => () => void
		}>
		ListItem: FC<RecoilListItemProps<DATA, META>>
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
}: RecoilListProps<DATA, META>): ReactElement => {
	const remove =
		useRemove?.() ||
		((id) =>
			console.warn(`tried to remove ${id}, but no useRemove was provided`))
	return (
		<Wrapper>
			{labels.length > 0 || NoItems === undefined ? (
				labels.map((label) => (
					<ListItemWrapper key={label.id}>
						<ListItem
							label={label}
							findState={findState}
							removeMe={() => remove(label.id)}
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
