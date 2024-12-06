import type { WritableFamilyToken, WritableToken } from "atom.io"
import type { FC, ReactElement } from "react"
import { useParams } from "react-router-dom"

import type { AtomListItemProps } from "./AtomList"

export type AtomEditorProps<T> = {
	id: string
	family: WritableFamilyToken<T, string>
	useRemove: () => (id: string) => void
}

export type IdFromRouteProps<T> = {
	Editor: FC<AtomEditorProps<T>>
	family: WritableFamilyToken<T, string>
	useRemove: () => (id: string) => void
}

export const IdFromRoute = <T,>({
	Editor,
	family,
	useRemove,
}: IdFromRouteProps<T>): ReactElement => {
	const { id } = useParams<{ id: string }>()
	if (!id) {
		throw new Error(`RouterAdaptor must be used with a route that has an id`)
	}
	return <Editor id={id} family={family} useRemove={useRemove} />
}

export type FromListItemProps<T> = AtomListItemProps<T> & {
	Editor: FC<AtomEditorProps<T>>
}

export const ListItem = <T,>({
	Editor,
	label,
	family: family,
	removeMe,
}: FromListItemProps<T>): ReactElement => {
	return <Editor id={label.id} family={family} useRemove={() => removeMe} />
}

export const AtomEditor = {
	ListItem,
	IdFromRoute,
}
