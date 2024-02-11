import { JsonEditor } from "hamr/react-json-editor"

import * as React from "react"

export type Next<X> = X | ((oldValue: X) => X)

export type DeriveChildren<Data> = (data: Data) => ReadonlyArray<unknown>

export type DataContext = {
	getDesigner: (input: unknown) => DataDesigner<any, any> | undefined
	getChildren: DeriveChildren<any>
}

export type TreeNodeType = `Leaf` | `Tree`

export type DDCoreProps<Data, _ extends TreeNodeType> = {
	data: Data
	set: (next: Next<Data>) => void
}

export type DataDesignerProps<Data, NodeType extends TreeNodeType> = DDCoreProps<
	Data,
	NodeType
> & {
	// hierarchical
	path?: ReadonlyArray<number | string>
	name?: string
	rename?: (newKey: string) => void
	remove?: () => void

	// meta
	isValid?: (data: Data) => boolean
	isHidden?: (path: ReadonlyArray<number | string>) => boolean
	isReadonly?: (path: ReadonlyArray<number | string>) => boolean
}

export type DataDesigner<Data, NodeType extends TreeNodeType> = React.FC<
	DataDesignerProps<Data, NodeType>
>

export const Stub: DataDesigner<any, any> = (props) => {
	return (
		<>
			<JsonEditor {...props} />
		</>
	)
}
